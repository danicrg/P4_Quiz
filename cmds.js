const {log, biglog, errorlog, colorize} = require("./out");
const model = require("./model");

/**
 *Muestra la ayuda
 *
 *@param rl Objeto readline usado para implementar CLI.
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> - Borrar el quiz indicado.");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|play - jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits -Créditos.");
    log(" q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * *@param rl Objeto readline usado para implementar CLI.
 */
exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {

        log(`  [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar CLI.
 * @param id Clave del quiz mostrar.
 */
exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`El valor del parámetro id no es válido.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`[${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.addCmd= rl => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')}: ${answer}`);
            rl.prompt();
        });
    });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};


/**
 * Edita un quiz del modelo.
 * @param id Clave del quiz a editar en el modelo.
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.editCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {

            const quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {

                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 * @param id Clave del quiz a probar.
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.testCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {

            const quiz = model.getByIndex(id);
            let pregunta = quiz.question.toString();
            rl.question(colorize(pregunta + '? ', 'red'), answer => {
                let respuesta = answer.toLowerCase().trim();
                let res = quiz.answer.toLowerCase().trim();

                if (respuesta === res){
                    log(`Su respuesta es correcta. `);
                    biglog('Correcta', 'green');
                    rl.prompt();
                } else {
                    log(`Su respuesta es incorrecta. `);
                    biglog('Incorrecta', 'red');
                    rl.prompt();
                }
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();

};


/**
 * Pregunta todos lo quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.playCmd = rl => {
    let score = 0;
    let toBeResolved = [];
    let i;
    for (i=0; i < model.count(); i++) {
        toBeResolved[i] = i;
    }
    const playOne = () => {
        if (toBeResolved.length === 0) {
            log(`No hay nada más que preguntar.`);
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(score, 'magenta');
            rl.prompt();
        } else {
            try {
                let id = toBeResolved.length*Math.random().toFixed(0);
                let posicion = toBeResolved.indexOf(parseInt(id));
                if (posicion !== -1) {
                    let quiz = model.getByIndex(id); //saca el quiz a preguntar
                    toBeResolved.splice(posicion,1); // borra el la posición del array de preguntas
                    let question = quiz.question.toString();
                    rl.question(colorize(question + '? ', 'red'), answer => {
                        let ans = answer.toLowerCase().trim();
                        let correctAns = quiz.answer.toLowerCase().trim();
                        if (ans === correctAns){
                            score ++;
                            log(`CORRECTO - Lleva ${score} aciertos.`)
                            playOne();
                        } else {
                            log(`INCORRECTO.`);
                            log(`Fin del juego. Aciertos: ${score}`);
                            biglog(score, 'magenta');
                            rl.prompt();
                        }
                    });
                } else {
                    playOne();
                }
            } catch (error) {
                errorlog(error.message);
                rl.prompt();
            }
        }
    }
    playOne();
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.creditsCmd = rl => {
    log("Autores de la práctica:");
    log("DANIEL CARLANDER", 'green');

    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};

