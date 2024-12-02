// Remplacez ces valeurs par votre propre Client-ID et Token d'accès Twitch
const clientId = 'gp762nuuoqcoxypju8c569th9wz7q5';
const token = '9exz1j5tl0nn4vlrmam1x4aho5q6qw';

// Fonction pour récupérer l'ID de la chaîne à partir de son nom d'utilisateur
async function getChannelId(username) {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Erreur lors de la récupération de l'ID de la chaîne pour ${username} : ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data.data.length === 0) {
            console.error(`Aucune chaîne trouvée pour ${username}`);
            return null;
        }

        return data.data[0].id;  // Retourne l'ID de la chaîne
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID de la chaîne :', error.message);
        return null;
    }
}

// Fonction pour récupérer les données de la chaîne Twitch
async function getTwitchDataByUsername(username) {
    try {
        const response = await fetch(`https://mixerno.space/api/twitch-user-counter/user/${username}`);

        if (!response.ok) {
            console.error(`Erreur lors de la récupération des données pour ${username} : ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || !data.user || data.user.length === 0 || !data.counts) {
            console.error(`Erreur : données non valides pour ${username}.`);
            return null;
        }

        const userInfo = data.user.find(item => item.value === 'name');
        const userLogo = data.user.find(item => item.value === 'pfp');
        const followerCount = data.counts.find(item => item.value === 'followers');

        return {
            username: userInfo ? userInfo.count : username,
            displayName: userInfo ? userInfo.count : username,
            logo: userLogo ? userLogo.count : '',
            followers: followerCount ? followerCount.count : 0
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${username} :`, error.message);
        return null;
    }
}

// Fonction pour mettre à jour le compteur de followers
function updateFollowerCounterPink(followers) {
    const followersElement = document.getElementById('sub-count-pink');
    if (followersElement) {
        followersElement.innerText = followers; // Odometer mettra à jour cette valeur
    }
}

// Fonction pour vérifier si la chaîne est en direct
async function checkIfOnAirPink(channelId) {
    try {
        const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${channelId}`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!streamResponse.ok) throw new Error(`Erreur flux : ${streamResponse.status}`);
        
        const streamData = await streamResponse.json();
        const isOnAir = streamData.data.length > 0;

        const onAirElement = document.getElementById('on-air-pink');
        if (isOnAir) {
            onAirElement.classList.add('live');
            onAirElement.textContent = "ON AIR";
        } else {
            onAirElement.classList.remove('live');
            onAirElement.textContent = "";
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du flux en direct :', error.message);
    }
}

// Fonction principale pour récupérer et afficher les données de la chaîne
async function fetchAndDisplayTwitchDataPink() {
    const username = "votre_nom_utilisateur_rose"; // Remplacez par le nom d'utilisateur pour le compteur rose
    const logoElement = document.getElementById('channel-logo-pink');
    const nameElement = document.getElementById('channel-name-pink');

    if (!logoElement || !nameElement) {
        console.error("Un ou plusieurs éléments HTML nécessaires sont introuvables.");
        return;
    }

    const channelData = await getTwitchDataByUsername(username);

    if (channelData) {
        updateFollowerCounterPink(channelData.followers);

        logoElement.src = channelData.logo;
        nameElement.textContent = channelData.displayName;

        const channelId = await getChannelId(username);
        if (channelId) {
            await checkIfOnAirPink(channelId);
        }
    } else {
        console.error(`Aucune donnée trouvée pour ${username}.`);
    }
}

// Démarrer le rafraîchissement automatique
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTwitchDataPink();
    setInterval(fetchAndDisplayTwitchDataPink, 1000); // Rafraîchit toutes les 1 seconde
});
