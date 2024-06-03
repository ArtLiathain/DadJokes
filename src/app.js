document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the values from the form
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Create the payload
    const payload = {
        user: username,
        pass: password
    };

    // Send a POST request to the server
    fetch('/validateUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            // Handle the response from the server
            const resultDiv = document.getElementById('result');
            if (data.error) {
                resultDiv.textContent = data.error;
            } else {
                resultDiv.textContent = data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
