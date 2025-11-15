exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body || '{}');

        // Validate input
        if (!body.hasOwnProperty('number')) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required field: number'
                })
            };
        }

        const number = parseFloat(body.number);

        // Validate that it's a valid number
        if (isNaN(number)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Invalid number provided'
                })
            };
        }

        // Multiply by 3
        const result = number * 3;

        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                input: number,
                result: result
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};
