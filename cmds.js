const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require("./model");
const Sequelize = require('sequelize');

/**
 *Muestra la ayuda
 *
 *@param rl Objeto readline usado para implementar CLI.
 */
exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, " h|help - Muestra esta ayuda.");
    log(socket, " list - Listar los quizzes existentes.");
    log(socket, " show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket, " add - Añadir un nuevo quiz interactivamente.");
    log(socket, " delete <id> - Borrar el quiz indicado.");
    log(socket, " edit <id> - Editar el quiz indicado.");
    log(socket, " test <id> - Probar el quiz indicado.");
    log(socket, " p|play - jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, " credits -Créditos.");
    log(socket, " q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * *@param rl Objeto readline usado para implementar CLI.
 */
exports.listCmd = (socket, rl) => {

    models.quiz.findAll()
        .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Esta función devuelve una promesa que:
 *   - Valida que se ha introducido un valor para el parametro.
 *   - Convierte el parametro en un numero entero
 * Si tod va bien, la promesa se satisface y devuelce el valor de id a usar.
 *
 * @param id Parametro con el índice a validar
 */
const validateId = id => {

    return new Sequelize.Promise((resolve,reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id); // coger la parte entera y descartar lo demás
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar CLI.
 * @param id Clave del quiz mostrar.
 */
exports.showCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });

};

/**
 * Esta función convierte la llamada rl.question, que está basada en callbacks en una
 * basada en promesas.
 *
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * Entonces la llamda a then que hay que hacer la promesa devuelta será:
 * 		.then(answer => {...})
 *
 * 	También colorea en rojo el texto de la pregunta, elimina espacios al principio y final
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {
    return new Sequelize.Promise ((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.addCmd= (socket, rl) => {

    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca la respuesta ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then (quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket, ` [${colorize('Se ha añadido', 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(socket, message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });
};


/**
 * Edita un quiz del modelo.
 * @param id Clave del quiz a editar en el modelo.
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.editCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then (quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, ' Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                    return makeQuestion(rl, ' Introduzca la respuesta: ')
                        .then(a => {
                            quiz.question =	q;
                            quiz.answer =a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then((quiz) => {
            log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 * @param id Clave del quiz a probar.
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then (quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, `${quiz.question}? `)
                .then(ans => {
                    let respuesta = ans.toLowerCase().trim();
                    let res = quiz.answer.toLowerCase().trim();

                    if (respuesta === res) {
                        //log(`Su respuesta es correcta. `);
                        //biglog('Correcta', 'green');
                        log(socket, 'Correcta', 'green');

                    } else {
                        //log(`Su respuesta es incorrecta. `);
                        //biglog('Incorrecta', 'red');
                        log(socket, 'Incorrecta', 'red');

                    }
                });
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });

};


/**
 * Pregunta todos lo quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.playCmd = (socket, rl) => {
    let score = 0;
    let toBeResolved = [];
    models.quiz.findAll()
        .each(quiz => {
            toBeResolved.push(quiz);
        })
        .then( () => {
            const play = () => {

                if (toBeResolved.length === 0) {
                    log(socket, `No hay nada más que preguntar.`);
                    log(socket, `Fin del juego. Aciertos: ${score}`);
                    biglog(socket, score, 'magenta');
                    rl.prompt();
                } else {
                    let id = Math.floor(Math.random() * toBeResolved.length);
                    let quiz = toBeResolved[id];
                    toBeResolved.splice(id, 1);
                            return makeQuestion(rl, `${quiz.question}? `)
                                .then( ans => {
                                    if (ans.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                                        log(socket, `CORRECTO - Lleva ${++score} aciertos.`);
                                        play();
                                    } else {
                                        log(socket, `INCORRECTO.`);
                                        log(socket, `Fin del juego. Aciertos: ${score}`);
                                        biglog(socket, score, 'magenta');
                                    }
                                })
                                .catch(Sequelize.ValidationError, error => {
                                errorlog(socket, 'El quiz es erroneo:');
                                error.errors.forEach(({message}) => errorlog(socket, message));
                                })
                                .catch(error => {
                                    errorlog(socket, error.message);
                                })
                                .then (() => {
                                    rl.prompt();
                                });

                }
            }
            play();
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then (() => {
            rl.prompt();
        });

};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.creditsCmd = (socket, rl) => {
    log(socket, "Autores de la práctica:");
    log(socket, "DANIEL CARLANDER", 'green');

    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};

