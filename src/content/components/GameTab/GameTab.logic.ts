import { GLOBAL_STATE } from '../../services';

// Open tab when button is pressed
const openTab = (button: HTMLElement, gameId: string) => {
    const tab = document.getElementById(`${gameId}-tab`);
    if (tab === null) {
        throw new Error('Game Tab HTML is malformed');
    }
    const tabContent = document.getElementsByClassName(
        'bmhs-tabcontent'
    ) as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = 'none';
    }
    const tabLinks = document.getElementsByClassName(
        'bmhs-tablinks'
    ) as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(' active', '');
    }
    tab.style.display = 'block';
    button.className += ' active';
};

export function prepGameTabs() {
    const gamePlaytime = GLOBAL_STATE.gamePlaytime;
    // Get all elements with class="bmhs-tabcontent" and hide all except first
    // Set first element with class="bmhs-tablinks" to "active"
    const tabLinks = document.getElementsByClassName(
        'bmhs-tablinks'
    ) as HTMLCollectionOf<HTMLElement>;
    const tabContent = document.getElementsByClassName(
        'bmhs-tabcontent'
    ) as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < tabContent.length; i++) {
        if (i === 0) {
            tabContent[0].style.display = 'block';
            tabLinks[0].classList.add('active');
        } else {
            tabContent[i].style.display = 'none';
        }
    }

    // Add event listener to each tab button and playtime chart button
    Object.keys(gamePlaytime).forEach((gameId) => {
        const tabButton = document.getElementById(`${gameId}-button`);
        if (tabButton === null) {
            throw new Error('Game Tab HTML is malformed');
        }
        tabButton.addEventListener('click', () => openTab(tabButton, gameId));
    });
}
