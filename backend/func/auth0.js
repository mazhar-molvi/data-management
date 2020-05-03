module.exports.CreateAuthToken = function (authJson) {
    return new Promise(function (resolve, reject) {
        console.log('authJson: ' + authJson.authJson);
        setTimeout(() => {
            resolve(authJson);
        }, 3000);
    });
};