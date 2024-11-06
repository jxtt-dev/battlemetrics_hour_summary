// Fetch session data from BattleMetrics API
const fetchSessionData = async (playerId, numberOfWeeks) => {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() - 7 * numberOfWeeks);

    // Example URL: https://api.battlemetrics.com/players/[playerId]/relationships/sessions?include=server&page%5Bsize%5D=100
    const url =
        BM_API +
        playerId +
        '/relationships/sessions' +
        '?' +
        new URLSearchParams({
            'include': 'server',
            'page[size]': 100,
        }).toString();

    let nextUrl = '';
    let currentPage = 0;
    let sessionData = {
        data: [], // Array of sessions objects
        included: [], // Array of servers that sessions occurred on
    };

    try {
        // Keep fetching data until periodEnd date is reached
        do {
            // Use next link provided by API to fetch pages after page 1
            const response = await fetch(currentPage === 0 ? url : nextUrl);

            if (!response.ok) {
                throw new Error(
                    `BattleMetrics API Response status: ${response.status}`
                );
            }

            const json = await response.json();
            if (!('data' in json)) {
                throw new Error(`BattleMetrics API returned incorrect data`);
            }

            // Add current pages data to sessionData object
            sessionData = {
                data: [...sessionData.data, ...json.data],
                included: [...sessionData.included, ...json.included],
            };

            // Break if last page reached
            if (!('next' in json.links)) {
                break;
            }
            nextUrl = json.links.next;

            // Wait between requests to prevent rate limiting
            if (currentPage !== 0) {
                await sleep(1000);
            }
            currentPage++;
        } while (!sessionEndReached(sessionData, periodEnd));

        // Dedupe included array, which contains all servers played in sessions array
        sessionData['included'] = sessionData['included'].filter(
            (value, index, self) =>
                index === self.findIndex((x) => x.id === value.id)
        );

        return sessionData;
    } catch (e) {
        throw e;
    }
};

// Check if oldest session fetched is before the periodEnd cutoff
const sessionEndReached = (cumulativeData, periodEnd) => {
    const lastSession = cumulativeData.data.at(-1);
    const lastSessionStart = Date.parse(lastSession.attributes.start);
    const lastSessionEnd = Date.parse(lastSession.attributes.end);

    // True if last session starts or ends before periodEnd cutoff
    return lastSessionStart < periodEnd || lastSessionEnd < periodEnd;
};

const calculatePastSessions = (sessionData, numberOfWeeks) => {
    const pastSessions = {};

    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

    const now = new Date().getTime();
    const weekBoundaries = Array(numberOfWeeks)
        .fill(0)
        .map((_, index) => {
            const weekEnd = now - index * MS_PER_WEEK;
            const weekStart = weekEnd - MS_PER_WEEK;
            return { start: weekStart, end: weekEnd };
        });

    // Create a map of server IDs to game names
    const serverToGame = {};
    sessionData.included.forEach((server) => {
        serverToGame[server.id] = server.relationships.game.data.id;
    });

    // Process each session
    sessionData.data.forEach((session) => {
        const serverId = session.relationships.server.data.id;
        const gameName = serverToGame[serverId];
        const startTime = new Date(session.attributes.start).getTime();
        const stopTime = new Date(session.attributes.stop).getTime();

        // Initialize arrays for new games
        if (!pastSessions[gameName]) {
            pastSessions[gameName] = new Array(numberOfWeeks).fill(0);
        }

        const sessionTime = stopTime - startTime;

        // Get week index of start and end of current session
        const startWeekIndex = weekBoundaries.findIndex(
            (boundary) =>
                startTime >= boundary.start && startTime < boundary.end
        );

        const stopWeekIndex = weekBoundaries.findIndex(
            (boundary) => stopTime > boundary.start && stopTime <= boundary.end
        );

        // If session fits entirely within one week
        if (startWeekIndex === stopWeekIndex && startWeekIndex !== -1) {
            pastSessions[gameName][startWeekIndex] += sessionTime;
        } else if (startWeekIndex !== -1 || stopWeekIndex !== -1) {
            // If session spans multiple weeks
            weekBoundaries.forEach((boundary, i) => {
                const overlapStart = Math.max(startTime, boundary.start);
                const overlapEnd = Math.min(stopTime, boundary.end);

                if (overlapEnd > overlapStart) {
                    const overlapTime = overlapEnd - overlapStart;
                    pastSessions[gameName][i] += overlapTime;
                }
            });
        }
    });

    // Convert milliseconds to hours
    for (const game in pastSessions) {
        pastSessions[game] = pastSessions[game].map(
            (millisecondsPerWeek) => millisecondsPerWeek / 3_600_000
        );
    }

    return pastSessions;
};

const pastSessionsWrapper = async (playerId, numberOfWeeks) => {
    const sessionData = await fetchSessionData(playerId, numberOfWeeks);
    return calculatePastSessions(sessionData, numberOfWeeks);
};
