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

// Fonction pour récupérer les données pour une chaîne Twitch
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

        // Extraire les informations nécessaires depuis la réponse JSON
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

// Fonction pour mettre à jour le compteur de followers avec Odometer
function updateFollowerCounter(followers) {
    const followersElement = document.getElementById('sub-count');
    
    if (followersElement) {
        // Appliquer la classe odometer si ce n'est pas déjà fait
        if (!followersElement.classList.contains('odometer')) {
            followersElement.classList.add('odometer');
        }

        // Mettre à jour le nombre de followers (Odometer va animer cette valeur)
        followersElement.innerText = followers;  // Odometer mettra à jour cette valeur
    }
}

// Fonction pour vérifier si la chaîne est en direct
async function checkIfOnAir(channelId) {
    try {
        const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${channelId}`, {
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!streamResponse.ok) throw new Error(`Erreur flux : ${streamResponse.status}`);
        
        const streamData = await streamResponse.json();
        const isOnAir = streamData.data.length > 0; // Si le tableau `data` n'est pas vide, la chaîne est en direct

        // Mettre à jour le badge "ON AIR"
        const onAirElement = document.getElementById('on-air');
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

// Fonction pour récupérer le nom d'utilisateur depuis l'URL
function getUsernameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username'); // Récupère le paramètre "username" de l'URL
}

// Fonction pour abréger le nom s'il dépasse 10 caractères
function abbreviateName(name) {
    const maxLength = 10;
    if (name.length > maxLength) {
        return name.slice(0, maxLength) + '...';  // Tronque et ajoute "..."
    }
    return name;
}

// Fonction principale pour récupérer et afficher les données de la chaîne
async function fetchAndDisplayTwitchData() {
    const username = getUsernameFromURL();  // Récupère le nom d'utilisateur depuis l'URL
    const logoElement = document.getElementById('channel-logo');
    const nameElement = document.getElementById('channel-name');

    if (!logoElement || !nameElement) {
        console.error("Un ou plusieurs éléments HTML nécessaires sont introuvables.");
        return;
    }

    if (username) {
        const channelData = await getTwitchDataByUsername(username);
        
        if (channelData) {
            // Mise à jour du compteur de followers avec Odometer
            updateFollowerCounter(channelData.followers);

            // Mise à jour des éléments avec les nouvelles données
            logoElement.src = channelData.logo;

            // Utilisation de la fonction pour abréger le nom
            nameElement.textContent = abbreviateName(channelData.displayName);

            // Récupérer l'ID de la chaîne et vérifier si elle est en direct
            const channelId = await getChannelId(username);
            if (channelId) {
                await checkIfOnAir(channelId);
            }
        } else {
            console.error(`Aucune donnée trouvée pour ${username}.`);
        }
    } else {
        console.error("Nom d'utilisateur non trouvé dans l'URL.");
    }
}

// Fonction pour rafraîchir les données à intervalles réguliers
function startAutoRefresh(interval) {
    fetchAndDisplayTwitchData(); // Appel initial pour charger les données
    setInterval(fetchAndDisplayTwitchData, interval); // Requête périodique à chaque intervalle
}

// Appeler la fonction principale au chargement de la page et démarrer le rafraîchissement automatique
document.addEventListener('DOMContentLoaded', () => {
    startAutoRefresh(1000); // Rafraîchit toutes les 1 secondes (1000 ms)
});
