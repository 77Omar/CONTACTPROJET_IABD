// Variables globales
let contacts = [];
let currentContactId = null;
let currentAvatarBase64 = '';
let isEditing = false;

// Initialisation de l'application
document.addEventListener('deviceready', function() {
    console.log("Device is ready");
    loadContacts();

    // Gestion de l'upload de photo
    document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('avatarInput').click();
    });

    document.getElementById('avatarInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('avatarPreview').src = event.target.result;
                currentAvatarBase64 = event.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
        }
    });

    // Gestion du formulaire
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveContact();
    });

    // Gestion des boutons de détail
    document.getElementById('editContact').addEventListener('click', editContact);
    document.getElementById('deleteContact').addEventListener('click', deleteContact);
});

// Chargement des contacts
function loadContacts() {
    console.log("Loading contacts...");
    let options = new ContactFindOptions();
    options.multiple = true;
    options.hasPhoneNumber = true;
    let fields = ['displayName', 'name', 'phoneNumbers', 'emails', 'photos', 'organizations'];

    navigator.contacts.find(fields, function(contactsFound) {
        console.log("Found " + contactsFound.length + " contacts");
        contacts = contactsFound;
        showContacts(contacts);
    }, onError, options);
}

// Affichage des contacts dans la liste
function showContacts(contacts) {
    let contactsHtml = "";

    contacts.forEach((contact, index) => {
        const name = contact.displayName ||
                    (contact.name ? `${contact.name.givenName} ${contact.name.familyName}` : 'Inconnu');
        const phone = contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].value : 'Pas de téléphone';

        let avatarSrc = 'img/home.png';
        if (contact.photos && contact.photos[0]) {
            if (contact.photos[0].type === 'url') {
                avatarSrc = contact.photos[0].value;
            } else if (contact.photos[0].type === 'base64') {
                avatarSrc = 'data:image/jpeg;base64,' + contact.photos[0].value;
            }
        }

        contactsHtml += `
            <li>
                <a href="#" onclick="showDetailPage(${index})">
                    <img src="${avatarSrc}" onerror="this.src='img/home.png'">
                    <h2>${name}</h2>
                    <p>${phone}</p>
                </a>
            </li>
        `;
    });

    document.getElementById('contactList').innerHTML = contactsHtml;
    $('#contactList').listview('refresh');
}

// Sauvegarde d'un contact (création ou mise à jour)
function saveContact() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const organization = document.getElementById('organization').value;

    if (!firstName || !lastName || !phone) {
        showNotification('Veuillez remplir les champs obligatoires');
        return;
    }

    if (isEditing) {
        // Mise à jour du contact existant
        const contact = contacts[currentContactId];

        // Mise à jour des propriétés
        contact.displayName = `${firstName} ${lastName}`;
        contact.name = {
            givenName: firstName,
            familyName: lastName
        };

        // Mise à jour du téléphone
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            contact.phoneNumbers[0].value = phone;
        } else {
            contact.phoneNumbers = [new ContactField('mobile', phone, true)];
        }

        // Mise à jour de l'email
        if (email) {
            if (contact.emails && contact.emails.length > 0) {
                contact.emails[0].value = email;
            } else {
                contact.emails = [new ContactField('email', email, false)];
            }
        } else if (contact.emails) {
            contact.emails = [];
        }

        // Mise à jour de l'organisation
        if (organization) {
            if (contact.organizations && contact.organizations.length > 0) {
                contact.organizations[0].name = organization;
            } else {
                const org = new ContactOrganization(true, 'work');
                org.name = organization;
                contact.organizations = [org];
            }
        } else if (contact.organizations) {
            contact.organizations = [];
        }

        // Mise à jour de la photo
        if (currentAvatarBase64) {
            contact.photos = [new ContactField('base64', currentAvatarBase64, false)];
        } else if (!contact.photos) {
            contact.photos = [new ContactField('url', 'img/home.png', false)];
        }

        // Sauvegarde
        contact.save(function() {
            showNotification('Contact mis à jour avec succès!');
            loadContacts();
            resetForm();
            $.mobile.changePage('#homepage');
        }, onError);

    } else {
        // Création d'un nouveau contact
        let contact = navigator.contacts.create({
            displayName: `${firstName} ${lastName}`,
            name: {
                givenName: firstName,
                familyName: lastName
            }
        });

        // Ajout des informations
        contact.phoneNumbers = [new ContactField('mobile', phone, true)];

        if (email) {
            contact.emails = [new ContactField('email', email, false)];
        }

        if (organization) {
            const org = new ContactOrganization(true, 'work');
            org.name = organization;
            contact.organizations = [org];
        }

        if (currentAvatarBase64) {
            contact.photos = [new ContactField('base64', currentAvatarBase64, false)];
        } else {
            contact.photos = [new ContactField('url', 'img/home.png', false)];
        }

        // Sauvegarde
        contact.save(function() {
            showNotification('Contact ajouté avec succès!');
            loadContacts();
            resetForm();
            $.mobile.changePage('#homepage');
        }, onError);
    }
}

// Préparation d'un nouveau contact
function prepareNewContact() {
    isEditing = false;
    document.getElementById('formTitle').textContent = 'Nouveau Contact';
    resetForm();
}

// Réinitialisation du formulaire
function resetForm() {
    document.getElementById('contactForm').reset();
    document.getElementById('avatarPreview').src = 'img/home.png';
    currentAvatarBase64 = '';
    document.getElementById('avatarInput').value = '';
}

// Affichage de la page de détail
function showDetailPage(index) {
    currentContactId = index;
    const contact = contacts[index];

    // Extraction des informations
    const name = contact.displayName ||
                (contact.name ? `${contact.name.givenName} ${contact.name.familyName}` : 'Inconnu');
    const phone = contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].value : 'Pas de téléphone';
    const email = contact.emails && contact.emails[0] ? contact.emails[0].value : 'Pas d\'email';
    const org = contact.organizations && contact.organizations[0] ? contact.organizations[0].name : 'Pas d\'organisation';

    let avatarSrc = 'img/home.png';
    if (contact.photos && contact.photos[0]) {
        if (contact.photos[0].type === 'url') {
            avatarSrc = contact.photos[0].value;
        } else if (contact.photos[0].type === 'base64') {
            avatarSrc = 'data:image/jpeg;base64,' + contact.photos[0].value;
        }
    }

    // Mise à jour de l'UI
    document.getElementById('detailName').textContent = name;
    document.getElementById('detailPhone').textContent = phone;
    document.getElementById('detailEmail').textContent = email;
    document.getElementById('detailOrganization').textContent = org;
    document.getElementById('detailAvatar').src = avatarSrc;

    document.getElementById('detailPhoneLink').href = `tel:${phone}`;
    document.getElementById('detailEmailLink').href = `mailto:${email}`;

    $.mobile.changePage('#detailPage');
}

function editContact() {
    if (currentContactId === null) return;

    isEditing = true;
    const contact = contacts[currentContactId];

    document.getElementById('formTitle').textContent = 'Modifier Contact';

    document.getElementById('firstName').value = contact.name ? contact.name.givenName || '' : '';
    document.getElementById('lastName').value = contact.name ? contact.name.familyName || '' : '';
    document.getElementById('phone').value = contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].value || '' : '';
    document.getElementById('email').value = contact.emails && contact.emails[0] ? contact.emails[0].value || '' : '';
    document.getElementById('organization').value = contact.organizations && contact.organizations[0] ? contact.organizations[0].name || '' : '';

    // Gestion de l'avatar
    currentAvatarBase64 = '';
    if (contact.photos && contact.photos[0]) {
        if (contact.photos[0].type === 'url') {
            document.getElementById('avatarPreview').src = contact.photos[0].value;
        } else if (contact.photos[0].type === 'base64') {
            document.getElementById('avatarPreview').src = 'data:image/jpeg;base64,' + contact.photos[0].value;
            currentAvatarBase64 = contact.photos[0].value;
        }
    } else {
        document.getElementById('avatarPreview').src = 'img/home.png';
    }

    $.mobile.changePage('#formPage');
}


function deleteContact() {
    if (currentContactId === null) return;

    if (confirm('Voulez-vous vraiment supprimer')) {
        contacts[currentContactId].remove(function() {

            loadContacts();
            $.mobile.changePage('#homepage');
        }, onError);
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(function() {
        notification.style.display = 'none';
    }, 3000);
}

function onError(error) {
    console.error('Error:', error);
    showNotification('Une erreur est survenue: ' + (error.message || error));
}
