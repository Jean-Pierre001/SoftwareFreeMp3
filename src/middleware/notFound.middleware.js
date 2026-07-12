function notFound(req, res, next) {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error 404</title>

            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: Arial, Helvetica, sans-serif;
                }

                body {
                    height: 100vh;
                    background: #000;
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }

                .container {
                    max-width: 600px;
                    padding: 40px;
                }

                h1 {
                    font-size: 120px;
                    font-weight: 900;
                    letter-spacing: 5px;
                    margin-bottom: 20px;
                    color: #fff;
                }

                h2 {
                    font-size: 32px;
                    margin-bottom: 15px;
                }

                p {
                    color: #aaa;
                    font-size: 18px;
                    margin-bottom: 35px;
                }

                a {
                    display: inline-block;
                    padding: 14px 35px;
                    border: 2px solid white;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    transition: 0.3s;
                }

                a:hover {
                    background: white;
                    color: black;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <h1>404</h1>
                <h2>Página no encontrada</h2>
                <p>
                    La URL que intentaste acceder no existe o fue eliminada.
                </p>

                <a href="/">
                    Volver al inicio
                </a>
            </div>
        </body>
        </html>
    `);
}

module.exports = notFound;