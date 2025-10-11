// Discord presence: show a green dot only when online

const DISCORD_ID = '1026038144308617318';

async function fetchPresence() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch presence');
        }

        const data = await response.json();
        return data?.data?.discord_status === 'online';
    } catch (error) {
        console.error('Presence fetch error:', error);
        return false;
    }
}

function showOnlineDot() {
    const wrapper = document.getElementById('discord-widget-wrapper');
    const dot = document.getElementById('discord-status-dot');
    const username = document.getElementById('discord-username');
    const subtext = document.getElementById('discord-subtext');
    if (!wrapper || !dot || !username || !subtext) return;
    wrapper.style.display = 'flex';
    // ensure text values
    username.textContent = 'aneiyy1';
    subtext.textContent = 'Online';
}

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = await fetchPresence();

    const wrapper = document.getElementById('discord-widget-wrapper');
    if (!isOnline) {
        if (wrapper) wrapper.style.display = 'none';
        return;
    }
    showOnlineDot();
});
