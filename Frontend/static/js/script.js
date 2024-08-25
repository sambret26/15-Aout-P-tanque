/* Listeners */

document.addEventListener('DOMContentLoaded', async () => {
    await load();
});

document.querySelector('.right-arrow').addEventListener('click', () => {
    if (currentIndex < actualColumns - columnsPerView) {
        currentIndex++;
        updateView();
    }
});

document.querySelector('.left-arrow').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateView();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    function simulateClick(element) {
        if (element) {
            element.click();
        }
    }

    function handleKeydown(event) {
        // Codes des touches fléchées gauche et droite
        const ENTER_KEY = 13;
        const LEFT_ARROW_KEY = 37;
        const RIGHT_ARROW_KEY = 39;

        // Déterminez l'élément sur lequel faire un clic en fonction de la touche pressée
        if (event.keyCode === LEFT_ARROW_KEY) {
            const leftArrowButton = document.querySelector('.left-arrow');
            simulateClick(leftArrowButton);
        } else if (event.keyCode === RIGHT_ARROW_KEY) {
            const rightArrowButton = document.querySelector('.right-arrow');
            simulateClick(rightArrowButton);
        } else if (event.keyCode === ENTER_KEY) {
            const validateButton = document.querySelector(`.validate-button-${currentIndex}`);
            simulateClick(validateButton);
        }
    }
    document.addEventListener('keydown', handleKeydown);
});

function updateView() {
    const offset = -(100 / columnsPerView) * currentIndex;
    columns.style.transform = `translateX(${offset}%)`;

    document.querySelector('.left-arrow').style.display = currentIndex > 0 ? 'block' : 'none';
    document.querySelector('.right-arrow').style.display = currentIndex < actualColumns - columnsPerView ? 'block' : 'none';
}

async function getTeamsNumber() {
    const response = await fetch('/api/getTeamsNumber').then(response => response.json());
    return response.teamsNumber;
}

/* init */
let currentIndex = 0;
const columns = document.querySelector('.columns');
const totalColumns = document.querySelectorAll('.column').length;
let actualColumns = totalColumns; 
const columnsPerView = 2;
let firstOpeningInit = true;
let firstOpeningRegister = true;
let firstOpeningUnRegister = true;
let firstOpeningCreateMatch = true;
let columnHidden = 1;

async function load() {
    const promises = [];
    for (let i = 1; i <= 8; i++) {
        promises.push(loadWaitingList(i));
        promises.push(loadMatches(i));
    }
    await Promise.all(promises);
    await updateAll();  // Mettre à jour les composants après chargement des données
    totalTeam = await getTeamsNumber();
    columnHidden = updateColumnVisibility(totalTeam);
    actualColumns = totalColumns - columnHidden;
}

async function loadMatches(round) {
    try {
        const [prioList, noPrioList] = await Promise.all([
            fetch(`/api/matchesPrio/${round}`).then(response => response.json()),
            fetch(`/api/matchesNoPrio/${round}`).then(response => response.json())
        ]);
        displayMatches(prioList, noPrioList, round);
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

async function loadWaitingList(round) {
    try {
        const [prioList, noPrioList] = await Promise.all([
            fetch(`/api/waitingPrio/${round}`).then(response => response.json()),
            round > 1 ? fetch(`/api/waitingNoPrio/${round}`).then(response => response.json()) : []
        ]);
        displayWaitingList(prioList, noPrioList, round);
    } catch (error) {
        console.error('Error loading waiting list:', error);
    }
}

async function updateAll() {
    updateRadios();
    updateCheckbox();
    updateMatchDivs();
}

function displayWaitingList(teamsPrio, teamsNoPrio, round) {
    const waitingListContainer = document.getElementById(`waiting-list-container-${round}`);
    waitingListContainer.innerHTML = '';
    const columnNumber = (teamsPrio.length + teamsNoPrio.length)/30;
    const modulo = columnNumber <= 4 ? 30 : 39; 
    let subColumn;
    teamsPrio.forEach((team, index) => {
        if (index % modulo === 0) {
            subColumn = document.createElement('div');
            subColumn.className = 'waiting-list';
            if (round == 2 || round == 3 ) {
                const teamDiv = document.createElement('div');
                teamDiv.className = 'waiting-team';
                teamDiv.textContent = "W";
                subColumn.appendChild(teamDiv);
            }
            waitingListContainer.appendChild(subColumn);
        }

        const teamDiv = document.createElement('div');
        teamDiv.className = 'waiting-team';
        teamDiv.textContent = team;

        subColumn.appendChild(teamDiv);
    });
    teamsNoPrio.forEach((team, index) => {
        if (index % 30 === 0) {
            subColumn = document.createElement('div');
            subColumn.className = 'waiting-list';
            if (round ==2 || round == 3 ) {
                const teamDiv = document.createElement('div');
                teamDiv.className = 'waiting-team';
                teamDiv.textContent = "L";
                subColumn.appendChild(teamDiv);
            }
            waitingListContainer.appendChild(subColumn);
        }

        const teamDiv = document.createElement('div');
        teamDiv.className = 'waiting-team';
        teamDiv.textContent = team;

        subColumn.appendChild(teamDiv);
    });
}

function createRadio(match, round, teamNumber) {
    const teamRadio = document.createElement('input');
    let team = (teamNumber === 1) ? match.team1 : match.team2;
    teamRadio.type = 'radio';
    teamRadio.name = `${match.id}`;
    teamRadio.value = team;
    teamRadio.round = round;
    if (match.winner === team) {
        teamRadio.checked = true;
        teamRadio.dataset.checked = 'true';
    } else {
        teamRadio.checked = false;
        teamRadio.dataset.checked = 'false';
    }
    return teamRadio;
}

function createLabel(match, teamNumber) {
    const teamLabel = document.createElement('span');
    teamLabel.className = 'match-label';
    teamLabel.textContent = (teamNumber === 1) ? match.team1 : match.team2;
    return teamLabel;
}

function createCheckbox(match, round) {
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.name = `${match.id}`;
    checkBox.className = 'match-checkbox';
    checkBox.round = round;
    if (match.status > 0) {
        checkBox.checked = true;
        checkBox.dataset.checked = 'true';
    } else {
        checkBox.checked = false;
        checkBox.dataset.checked = 'false';
    }
    return checkBox;
}

function handleMatch(match, round, listLength, otherListLength) {
    const matchDiv = document.createElement('div');
    if(otherListLength === 0 && listLength < 31) {
        matchDiv.className = 'match single-match-list';
    } else {
        matchDiv.className = 'match';
    }

    matchDiv.appendChild(createLabel(match, 1));
    matchDiv.appendChild(createRadio(match, round, 1));
    matchDiv.appendChild(createRadio(match, round, 2))
    matchDiv.appendChild(createLabel(match, 2));
    matchDiv.appendChild(createCheckbox(match, round));
    return matchDiv;
}

function displayMatches(matchesPrio, matchesNoPrio, round) {
    const matchListContainer = document.getElementById(`match-list-container-${round}`);
    matchListContainer.innerHTML = '';
    let subColumn;
    matchesPrio.forEach((match, index) => {
        if (index %30 === 0) {
            subColumn = document.createElement('div');
            subColumn.className = 'match-list';
            matchListContainer.appendChild(subColumn);
        }
        subColumn .appendChild(handleMatch(match, round, matchesPrio.length, matchesNoPrio.length));
    })
    matchesNoPrio.forEach((match, index) => {
        if (index %30 === 0) {
            subColumn = document.createElement('div');
            subColumn.className = 'match-list';
            matchListContainer.appendChild(subColumn);
        }
        subColumn .appendChild(handleMatch(match, round, matchesNoPrio.length, matchesPrio.length));
    })
}

function updateRadios() {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('click', function() {
            const relatedCheckbox = document.querySelector(`input[type="checkbox"][name="${this.name}"]`);

            if (this.dataset.checked === 'true') {
                this.checked = false;
                this.dataset.checked = 'false';
                unsetWinner(this.name, this.value, this.round);
            } else {
                document.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
                    r.checked = false;
                    r.dataset.checked = 'false';
                });
                this.checked = true;
                this.dataset.checked = 'true';
                if (relatedCheckbox) {
                    relatedCheckbox.checked = true;
                    relatedCheckbox.dataset.checked = 'true';
                }
                setWinner(this.name, this.value, this.round);
            }
        });
    });
}

async function validateWinnerByMatchId(name) {
    const relatedRadio = document.querySelector(`input[type="radio"][name="${name}"]`);
    const relatedCheckbox = document.querySelector(`input[type="checkbox"][name="${name}"]`);
    relatedRadio.checked = true;
    relatedRadio.dataset.checked = 'true';
    if (relatedCheckbox) {
        relatedCheckbox.checked = true;
        relatedCheckbox.dataset.checked = 'true';
    }
    await updateMatchDivs();
}

function updateCheckbox() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkBox => {
        checkBox.addEventListener('click', async function() {
            if (this.checked) {
                this.dataset.checked = 'true';
                startMatch(this.name, this.round);
            } else {
                this.dataset.checked = 'false';
                stopMatch(this.name, this.round);
            }
            await updateMatchDivs();
        });
    });
}

async function startMatches(round) {
    const checkBoxes = document.querySelectorAll(`input[type="checkbox"]`);
    for (const checkBox of checkBoxes) {
        if (checkBox.round === round && !checkBox.checked) {
            checkBox.checked = true;
            checkBox.dataset.checked = 'true';
            try {
                // Attendre que startMatch se termine avant de passer au suivant
                await startMatch(checkBox.name, checkBox.round);
                await updateMatchDivs();
            } catch (error) {
                console.error('Error starting match:', error);
            }
        }
    }
    await load();
}

function generateMatches(round) {
    startLoader("Génération des matchs en cours");
    fetch(`/api/generate/${round}`, {method: 'POST', headers: {'Content-Type': 'application/json'}})
        .then(() => load())
        .catch(error => console.error('Error generating matches:', error))
        .finally(() => {stopLoader()});
}

function unGenerateMatches(round) {
    startLoader("Suppression des matchs en cours");
    fetch(`/api/ungenerate/${round}`, {method: 'POST', headers: {'Content-Type': 'application/json'}})
        .then(() => load())
        .catch(error => console.error('Error ungenerating matches:', error))
        .finally(() => {stopLoader()});
}

async function startMatch(matchId, round) {
    try {
        await fetch(`/api/startMatch/${matchId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        //await reloadRound(round);  // Recharger seulement les données affectées
    } catch (error) {
        console.error('Error starting match:', error);
    }
}

async function stopMatch(matchId, round) {
    try {
        await fetch(`/api/stopMatch/${matchId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        reloadRound(round);
    } catch (error) {
        console.error('Error stopping match:', error);
    }
}

async function setWinner(matchId, number, round) {
    try {
        await fetch(`/api/setWinner/${matchId}/${number}/${columnHidden}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        await reloadWaitingList(round + 1);  // Charger uniquement la liste d'attente du prochain round
    } catch (error) {
        console.error('Error setting winner:', error);
    }
}

async function unsetWinner(matchId, number, round) {
    try {
        await fetch(`/api/unsetWinner/${matchId}/${number}/${columnHidden}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        await reloadWaitingList(round + 1);
    } catch (error) {
        console.error('Error unsetting winner:', error);
    }
}

function updateMatchDivs() {
    document.querySelectorAll('.match').forEach(matchDiv => {
        const radios = matchDiv.querySelectorAll('input[type="radio"]');
        const checkbox = matchDiv.querySelector('input[type="checkbox"]');
        const anyRadioChecked = Array.from(radios).some(radio => radio.checked);
        const isCheckboxChecked = checkbox.checked;
        if (anyRadioChecked) {
            matchDiv.style.backgroundColor = 'green'; // Vert si au moins une radio est sélectionnée
        } else if (!anyRadioChecked && isCheckboxChecked) {
            matchDiv.style.backgroundColor = 'orange'; // Orange si aucune radio n'est sélectionnée et la checkbox est cochée
        } else {
            matchDiv.style.backgroundColor = ''; // Réinitialisez si aucune condition n'est remplie
        }
    });
}

function checkIsCorrectInteger(value, voidMessage) {
    if (value == '') {
        showErrorPopup(voidMessage);
        return 0;
    }
    if (!/^\d+$/.test(value)) {
        showErrorPopup(`${value} incorrect, merci de rentrer un nombre`);
        return 0;
    } 
    return 1;
}

async function createMatch(round) {
    const team1Input = document.getElementById(`match-team1-input-${round}`);
    const team2Input = document.getElementById(`match-team2-input-${round}`);
    const team1 = team1Input.value;
    const team2 = team2Input.value;
    if (!checkIsCorrectInteger(team1, 'Merci de renseigner une équipe dans la case \"Equipe 1\"')) return;
    if (!checkIsCorrectInteger(team2, 'Merci de renseigner une équipe dans la case \"Equipe 2\"')) return;
    try {
        const response = await fetch(`/api/createMatch/${round}/${team1}/${team2}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if(response.ok) {
            const data = await response.json();
            const status = data.status;
            switch(status) {
                case 200:
                    startLoader("Création du match")
                    await load().finally(() => stopLoader());
                    break;
                case 401:
                    document.getElementById('confirm-modal-create-match').style.display = 'flex';  
                    if (firstOpeningCreateMatch) {
                        document.getElementById('cancel-btn-create-match').addEventListener('click', function() {
                            document.getElementById('confirm-modal-create-match').style.display = 'none';
                        });
                        
                        document.getElementById('confirm-btn-create-match').addEventListener('click', async function() {
                            document.getElementById('confirm-modal-create-match').style.display = 'none';
                            startLoader("Création du match")
                            await fetch(`/api/forceCreateMatch/${round}/${team1}/${team2}`, {method: 'POST', headers: {'Content-Type': 'application/json'}})
                                .then(() => load())
                                .catch(error => console.error('Error in forcing match création:', error))
                                .finally(() => stopLoader());
                        });
                        firstOpeningCreateMatch = false;
                    }
                    break;
                case 404:
                    showErrorPopup(`Equipe ${team1} inexistante`);
                    break;
                case 405:
                    showErrorPopup(`Equipe ${team2} inexistante`);
                    break;
                case 500:
                    showErrorPopup('Une équipe ne peux pas jouer contre elle-même ;)')
                    break;
                case 501:
                    showErrorPopup(`Equipe ${team1} non inscrite à ce tour`);
                    break;
                case 502:
                    showErrorPopup(`Equipe ${team2} non inscrite à ce tour`);
                    break;
                case 503:
                    showErrorPopup(`Les deux équipes se sont déjà rencontrées`);
                    break;
                default:
                    showErrorPopup(`Error: Status ${status}`);
                    break;
            }
            team1Input.value = '';
            team2Input.value = '';
        } else {
            showErrorPopup(`HTTP Error: Status ${response.status}`); // Affiche une pop-up pour les erreurs HTTP
        }
    } catch (error) {
        showErrorPopup('Network Error: Unable to create match'); // Gère les erreurs réseau
    }
}

async function validateWinner(round) {
    const teamInput = document.getElementById(`match-validate-input-${round}`);
    const team = teamInput.value;
    if (!checkIsCorrectInteger(team, `Merci de renseigner un vainqueur pour le round ${round}`)) return;
    try {
        const response = await fetch(`/api/fetchMatchId/${round}/${team}/${columnHidden}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if(response.ok) {
            const data = await response.json();
            const status = data.status;
            switch(status){
                case 200:
                    const id = data.id;
                    await validateWinnerByMatchId(id);
                    break;
                case 404:
                    showErrorPopup(`Equipe ${team} inexistante`);
                    break;
                case 500:
                    showErrorPopup(`Equipe ${team} non inscrite à ce tour`);
                    break;
                case 501:
                    showErrorPopup(`Equipe ${team} en liste d'attente à ce tour`);
                    break;
                case 504:
                    showErrorPopup(`Résultat inverse déjà renseigné pour l'équipe ${team}`)
                    break;
                case 505:
                    showErrorPopup(`Problème de récupération du match de l'équipe ${team}`)
                    break;
                default:
                    showErrorPopup(`Error: Status ${status}`);
                    break;
            }
            teamInput.value = '';
        } else {
            showErrorPopup(`HTTP Error: Status ${response.status}`);
        }
    } catch (error) {
        showErrorPopup('Network Error: Unable to validate winner');
    }
}

async function reloadRound(round) {
    const promises = [];
    promises.push(loadWaitingList(round));
    promises.push(loadMatches(round));
    await Promise.all(promises);
    await updateAll();
}

async function reloadWaitingList(i) {
    if (i===4 && columnHidden) i++;
    await loadWaitingList(i);
    await updateMatchDivs();
}

function init() {
    document.getElementById('confirm-modal-init').style.display = 'flex';  
    if (firstOpeningInit) {
        document.getElementById('cancel-btn-init').addEventListener('click', function() {
            document.getElementById('confirm-modal-init').style.display = 'none';
        });
        
        document.getElementById('confirm-btn-init').addEventListener('click', function() {
            document.getElementById('confirm-modal-init').style.display = 'none';
            startLoader("Réinitialisation du concours");
            fetch(`/api/init`, {method: 'POST', headers: {'Content-Type': 'application/json'}})
                .then(() => load())
                .catch(error => console.error('Error in tournament regeneration:', error))
                .finally(() => {stopLoader()});
        });
        firstOpeningInit = false;
    }
}

function multiRegister() {
    const teamNumber = document.getElementById(`team-count`);
    const value = teamNumber.value;
    if (!checkIsCorrectInteger(value, "Merci de renseigner le nombre d'équipes à inscrire")) return;
    const modalMessage = document.querySelector('#confirm-modal-registration p');
    modalMessage.textContent = `Êtes-vous sûr de vouloir inscrire ${value} triplettes ?`;
    document.getElementById('confirm-modal-registration').style.display = 'flex';

    if (firstOpeningRegister) {
        document.getElementById('cancel-btn-registration').addEventListener('click', function() {
            document.getElementById('confirm-modal-registration').style.display = 'none';
        });
        
        document.getElementById('confirm-btn-registration').addEventListener('click', async function() {
            const dynamicValue = teamNumber.value;
            document.getElementById('confirm-modal-registration').style.display = 'none';
            startLoader(`Ajout de ${dynamicValue} triplettes `);
            await register(dynamicValue);
            stopLoader();
            teamNumber.value = '';
        });

        firstOpeningRegister = false;
    }
}

function unregister() {
    const teamNumber = document.getElementById(`team-unregister-number`);
    const value = teamNumber.value;
    if (!checkIsCorrectInteger(value, "Merci de renseigner le numéro d'équipes à désinscrire")) return;
    const modalMessage = document.querySelector('#confirm-modal-unregistration p');
    modalMessage.textContent = `Êtes-vous sûr de vouloir désinscrire la triplette ${value} ?`;
    document.getElementById('confirm-modal-unregistration').style.display = 'flex';
    if (firstOpeningUnRegister) {
        document.getElementById('cancel-btn-unregistration').addEventListener('click', function() {
            document.getElementById('confirm-modal-unregistration').style.display = 'none';
        });
        
        document.getElementById('confirm-btn-unregistration').addEventListener('click', async function() {
            const dynamicValue = teamNumber.value;
            document.getElementById('confirm-modal-unregistration').style.display = 'none';
            startLoader(`Désinscription de la triplette ${dynamicValue}`);
            await unregisterTeam(dynamicValue);
            stopLoader();
            teamNumber.value = '';
        });
        firstOpeningUnRegister = false;
    }
}

async function unregisterTeam(team){
    try {
        const response = await fetch(`/api/unregister/${team}`, {method: 'POST', headers: {'Content-Type': 'application/json'}});
        if(response.ok) {
            const data = await response.json();
            const status = data.status;
            switch(status) {
                case 200:
                    await load();
                    break;
                case 404:
                    showErrorPopup(`Equipe ${team} inexistante`);
                    break;
                case 500:
                    showErrorPopup(`Equipe ${team} associée à un match, impossible de la désinscrire`);
                    break;
                default:
                    showErrorPopup(`Error: Status ${status}`);
                    break;
            }
            await loadWaitingList(1);
        } else {
            showErrorPopup(`HTTP Error: Status ${response.status}`); // Affiche une pop-up pour les erreurs HTTP
        }
    } catch (error) {
        showErrorPopup('Network Error: Unable to unregister team'); // Gère les erreurs réseau
    }
}

async function register(number){
    return fetch(`/api/register/${number}`, {method: 'POST', headers: {'Content-Type': 'application/json'}})
        .then(() => load())
        .catch(error => console.error('Error in team registration:', error))
}

async function luckyLoser(round) {
    try {
        const teamNumber = document.getElementById(`lucky-loser-${round}`);
        const team = teamNumber.value;
        if (!checkIsCorrectInteger(team, "Merci de renseigner le numéro d'équipes à repêcher")) return;
        const response = await fetch(`/api/luckyLoser/${round}/${team}`, {method: 'POST', headers: {'Content-Type': 'application/json'}});
        if(response.ok) {
            const data = await response.json();
            const status = data.status;
            switch(status) {
                case 200:
                    startLoader("Repêchage en cours")
                    await load().finally(() => stopLoader());
                    break;
                case 404:
                    showErrorPopup(`Equipe ${team} inexistante`);
                    break;
                case 505:
                    showErrorPopup(`Equipe ${team} déjà associée à un match, impossible de la repêcher`);
                    break;
                default:
                    showErrorPopup(`Error: Status ${status}`);
                    break;
            }
            await loadWaitingList(round);
            teamNumber.value = '';
        } else {
            showErrorPopup(`HTTP Error: Status ${response.status}`); // Affiche une pop-up pour les erreurs HTTP
        }
    } catch (error) {
        showErrorPopup('Network Error: Impossible de repecher l\'équipe'); // Gère les erreurs réseau
    }
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.textContent = message;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000);
}

function startLoader(message = 'Chargement en cours...') {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loader-message').innerText = message;
}

function stopLoader() {
    document.getElementById('loader').style.display = 'none';
}

updateView();