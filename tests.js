const apiURL = 'http://localhost:8000';

(async () => {
    const BODY = {
        // register_params: {
        //     first_name: "Илья",
        //     last_name: "Карпушкин",
        //     password: "123123",
        //     phone_number: '+77775968003',
        // }
    };

    await fetch(apiURL + '/getGallery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(BODY)
    }).then(response => response.json())
        .then(res => {

        });
})();