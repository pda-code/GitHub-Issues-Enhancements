// Saves options to chrome.storage
function save_options() {
    var pat = document.getElementById('personalAccessToken').value;
    chrome.storage.sync.set({
        personalAccessToken: document.getElementById('personalAccessToken').value,
        displayOverview: document.getElementById('displayOverview').checked,
        displayEstimatedTime: document.getElementById('displayEstimatedTime').checked,
        displayDone: document.getElementById('displayDone').checked,
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        personalAccessToken: '',
        displayOverview: true,
        displayEstimatedTime: true,
        displayDone: true,
    }, function (items) {
        document.getElementById('personalAccessToken').value = items.personalAccessToken;
        document.getElementById('displayOverview').checked = items.displayOverview;
        document.getElementById('displayEstimatedTime').checked = items.displayEstimatedTime;
        document.getElementById('displayDone').checked = items.displayDone;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('showHide').addEventListener('click', function(){
    var x = document.getElementById("personalAccessToken");
    if (x.type === "password") {
        document.getElementById('showHide').innerText="Hide";
        x.type = "text";
    } else {
        document.getElementById('showHide').innerText="Show"
        x.type = "password";
    }

});