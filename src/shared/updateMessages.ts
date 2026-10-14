export const updateMessages: Record<string, string> = {
    '1.2.2': `
        <p>Bug fixes:</p>
        <ul>
            <li>Updates hour summary rendering for new Player Overview page.</li>
            <li>Add back current server to Player Overview page (requires API key).</li>
        </ul>
    `,
    '1.2.1': `
        <p>This update includes important changes due to recent BattleMetrics API updates:</p>
        <ul>
            <li><b>API key now required</b> - Viewing a player's previous identifiers and session history requires a valid BattleMetrics API key. These features will be disabled until one is configured.</li>
            <li>An API key setup guide is now available in the extension settings page.</li>
        </ul>
        <br/>
        <p>Bug fixes &amp; improvements:</p>
        <ul>
            <li>Fixed player search on the server page.</li>
            <li>Resolved rendering issues with player summaries.</li>
            <li>Improved player summary load performance.</li>
            <li>Applied various security hardening measures.</li>
        </ul>
        <br/>
        <p>Visit the releases page on GitHub to learn more: <a href="https://github.com/jxtt-dev/battlemetrics_hour_summary/releases" target="_blank" rel="noopener noreferrer">link</a></p>
    `,
};
