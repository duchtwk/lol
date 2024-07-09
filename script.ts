/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

let awaitingResponse: boolean = false;
let currentPopup: any = undefined;
let correctAnswers: number = 0;
const requiredCorrectAnswers: number = 2; // Anzahl der Fragen, die richtig sein müssen
let doorOpened: boolean = false; // Variable zum Verfolgen, ob die Tür bereits geöffnet wurde
let askedQuestions: number[] = []; // Array, um die IDs der bereits gestellten Fragen zu speichern

// Frage- und Antwortmöglichkeiten - Eingangstest
const questions = [
    {
        question: "Ich habe im Labor eine Tasse/Flasche ausgetrunken, diese... ",
        options: {
            a: ".. lasse ich auf dem Fensterbrett stehen.",
            b: "..Stelle ich neben den Mülleimer, Pfand gehört daneben!",
            c: ".. lasse ich unter dem Tisch stehen, das Räumt schon jemand weg",
            d: "... nehme ich mit aus dem Raum, oder schmeiße Sie in den Mülleimer im Labor."
        },
        correctAnswer: ['d'] // Definiere die richtigen Antworten für jede Frage als Array
    },
    {
        question: "Wohin werden am Ende jedes Laborversuchs benutzte Widerstände geräumt?",
        options: {
            a: "Einfach auf dem Platz liegenlassen, der Laboringenieur räumt die später weg.",
            b: "Die Widerstände kommen in die große Sammelbox, werden desinfiziert und vom Lehrpersonal weggeräumt.",
            c: "Die Widerstände werden zurück in den Sortimentkasten geräumt.",
            d: "Ich nehme sie einfach mit, es gibt ja genug davon."
        },
        correctAnswer: ['c']
    },
    {
        question: "Sie haben während der Versuchsvorbereitung Hunger oder Durst.",
        options: {
            a: "Mitgebrachte Speisen und Getränke dürfen im Labor konsumiert werden.",
            b: "Getränkebecher dürfen oben auf den Labortischen neben dem Oszilloskop abgestellt werden.",
            c: "Essen ist im Labor nicht gestattet, hierzu wird der Raum verlassen.",
            d: "Flüssigkeitsbehältnisse werden nicht auf den Tischen abgestellt, sondern auf dem Fußboden, sodass sie nicht umgestoßen werden können.",
            e: "Trinken ist am Laborplatz nicht erlaubt, im Gang zwischen den Tischen schon."
        },
        correctAnswer: ['c', 'd', 'e'] // Array für mehrere Antworten
    },
    {
        question: "Ich würde gerne auch am Wochenende im Hardwarelabor üben. Leider komme ich mit meiner Zugangskarte nicht ins Gebäude.",
        options: {
            a: "Ich bitte Prof. Wagner oder Herrn Ulbricht mir meine Karte freizuschalten.",
            b: "Geht halt nicht.",
            c: "Für den Studiengang Architektur gibt es seit ein paar Semestern eine Ausnahmegenehmigung für den Zugang am Wochenende. Ich informiere mich beim StuRa was man da machen kann, jedoch ohne Herrn Ulbricht oder Prof. Wagner dabei zu involvieren.",
            d: "Ich nehme sie einfach mit, es gibt ja genug davon."
        },
        correctAnswer: ['b','c']
    },
    {
        question: "Sie bauen in Vorbereitung auf Ihren Laborversuch eine Komplexe Schaltung auf. Diese möchten Sie gleich aufgebaut lassen, um bei der Prüfung Zeit zu sparen. Welche Materialien benutzen Sie?",
        options: {
            a: "Ich benutze die Kabelreste in der Kiste mit der Beschriftung 'Langzeitkabel' ",
            b: "Zum Kabel zuschneiden bin ich zu faul, ich kaufe mir selbst ein Satz Steckbrettkabel.",
            c: "Ich benutze das Steckbrett auf dem B15F-Board, davon gibt es schließlich 10 Stück.",
            d: "Ich benutze die Kabel aus der Box 'Kurzzeitkabel'."
        },
        correctAnswer: ['a', 'b']
    },
];

function getRandomQuestion() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * questions.length);
    } while (askedQuestions.includes(randomIndex));

    askedQuestions.push(randomIndex);
    return questions[randomIndex];
}

function askQuestion() {
    if (correctAnswers < requiredCorrectAnswers && askedQuestions.length < questions.length) {
        const question = getRandomQuestion();
        let message = question.question + "\n";
        for (const [key, value] of Object.entries(question.options)) {
            message += `${key.toUpperCase()}: ${value}\n`;
        }
        message += "Tippe einen Buchstaben ein, um deine Antwort zu wählen. (Mindestens zwei müssen richtig sein!)";
        WA.chat.sendChatMessage(message, "Diego");
        awaitingResponse = true;
    } else {
        openDoorIfAnsweredCorrectly();
    }
}

// Area-Enter von "NPC", um Chatöffnung mit Fragen zu triggern
WA.room.area.onEnter("NPC").subscribe(() => {
    if (!doorOpened) {
        askQuestion();
    } else {
        openDoorIfAnsweredCorrectly();
    }
});


//Chatabfrage mit Fehlerresponse
WA.chat.onChatMessage((message: string) => {
    if (awaitingResponse) {
        awaitingResponse = false;
        const question = questions[askedQuestions[askedQuestions.length - 1]];
        const answerKey = message.toLowerCase();
        if (question.options[answerKey]) {
            if (question.correctAnswer.includes(answerKey)) {
                correctAnswers++;
                WA.chat.sendChatMessage("Das war richtig!", "Diego");
            } else {
                WA.chat.sendChatMessage("Das war falsch.", "Diego");
            }
            askQuestion();
        } else {
            WA.chat.sendChatMessage("Was?, ich hab dich nicht verstanden. (Ungültige Eingabe)", "Diego");
            awaitingResponse = true; // Setze awaitingResponse zurück, falls die Eingabe ungültig war
        }
    }
});

WA.room.area.onLeave("NPC").subscribe(() => {
    console.log("Left NPC area");
    awaitingResponse = false;
});

//Testet ob Fragen richtig -> Öffnet Tür und bleibt offen
function openDoorIfAnsweredCorrectly() {
    if (correctAnswers >= requiredCorrectAnswers) {
        if (!doorOpened) {
            WA.room.hideLayer('Door');
            WA.room.hideLayer('door_collision');
            WA.chat.sendChatMessage("Die Tür ist jetzt offen!", "Diego");
            doorOpened = true; // Setze die Variable, um zu verhindern, dass die Tür erneut geöffnet wird
        }
    } else {
        WA.chat.sendChatMessage("Du hast nicht genügend Fragen richtig beantwortet, um die Tür zu öffnen. Lade die Seite neu und probiere es nochmal.", "Diego");
    }
}

//Infotafel vor dem Raum
WA.room.area.onEnter("Infotafel").subscribe(() => {
    console.log("Entered Infotafel area");
    if (currentPopup === undefined) {
        try {
            currentPopup = WA.ui.openPopup("Infotafel_popup", "AP08: Oszilloskop-Minigame|AP07: Lernvideo Oszilloskop|AP06: B15F-Board|AP05: Linux-Rechner|AP04: Multimeter-Minigame|AP03: Lernvideo Multimeter|AP02: Lernvideo Oszi|AP01: / |AP11: / |AP12: / |", [{
                label: "Close",
                className: "primary",
                callback: (popup) => {
                    popup.close();
                    currentPopup = undefined;
                }
            }]);
            console.log("Opened Infotafel_popup successfully");
        } catch (error) {
            console.error("Error while opening Infotafel_popup: ", error);
        }
    }
});

WA.room.area.onLeave("Infotafel").subscribe(() => {
    console.log("Left Infotafel area");
    closePopup();
});

WA.room.area.onEnter("Eingang").subscribe(() => {
    console.log("Entered Eingang area");
    if (currentPopup === undefined) {
        try {
            currentPopup = WA.ui.openPopup("Eingang_popup", "Willkommen im WorkAdventure-Raum des Hardwarelabores!", [{
                label: "Close",
                className: "primary",
                callback: (popup) => {
                    popup.close();
                    currentPopup = undefined;
                }
            }]);
            console.log("Opened Eingang_popup successfully");
        } catch (error) {
            console.error("Error while opening Eingang_popup: ", error);
        }
    }
});

WA.room.area.onLeave("Eingang").subscribe(() => {
    console.log("Left Eingang area");
    closePopup();
});

function closePopup() {
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}



//Arbeitsplätze


//Platz 1
/*WA.room.area.onEnter("AP01").subscribe(() => {
    console.log("Entered AP01 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "",
        callback: () => {
            WA.nav.openCoWebSite('XXX'); //
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});*/

//Platz 2
/*WA.room.area.onEnter("AP02").subscribe(() => {
    console.log("Entered AP02 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste, um das Lernvideo für das Oszilloskop anzusehen",
        callback: () => {
            WA.nav.openCoWebSite('XXX'); //
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});*/

//Platz 3
WA.room.area.onEnter("AP03").subscribe(() => {
    console.log("Entered AP03 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste, um das Lernvideo für das Multimeter anzusehen.",
        callback: () => {
            WA.nav.openCoWebSite('https://www.youtube.com/embed/O5zcFLvheXs?si=LoaEr1D-EbOnC1S8'); //
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

//Platz 4
//Multimeter-Minigame
WA.room.area.onEnter("AP04").subscribe(() => {
    console.log("Entered AP04 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste um das Multimeter zu bedienen.",
        callback: () => {
            WA.nav.openCoWebSite('https://duchtwk.github.io/Multimetergame.io/'); //Duc
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

//Platz 5
//Online Linux-Terminal
WA.room.area.onEnter("AP05").subscribe(() => {
    console.log("Entered AP05 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste um den Linux-Rechner zu starten.",
        callback: () => {
            WA.nav.openCoWebSite('https://linuxcontainers.org/incus/try-it/');
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

//Platz 6
//Lernvideo B15F
WA.room.area.onEnter("AP06").subscribe(() => {
    console.log("Entered AP06 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste um das Lernvideo zum B15F-Board aufzurufen.",
        callback: () => {
            WA.nav.openCoWebSite('https://www.youtube.com/embed/h8NExB40tYE?si=NZcqHHo-leODmqWt');
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

//Platz 7
//Oszi-Minigame
WA.room.area.onEnter("AP07").subscribe(() => {
    console.log("Entered AP07 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste um das Oszilloskop zu bedienen.",
        callback: () => {
            WA.nav.openCoWebSite('https://duchtwk.github.io/oziloskopsimulator.io/');
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

//Platz 8
//Oszi-Video
WA.room.area.onEnter("AP08").subscribe(() => {
    console.log("Entered AP08 area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste, um ein Tutorial zum Oszi anzuschauen.",
        callback: () => {
            WA.nav.openCoWebSite('https://www.youtube.com/embed/Nw9pu1oRmQU?si=62fwYdOBcbSemt65'); 
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});


//Widerstand-Minigame
WA.room.area.onEnter("Widerstand_Minigame").subscribe(() => {
    console.log("Entered Widerstand_Minigame area");
    const triggerMessage = WA.ui.displayActionMessage({
        message: "Drücke die Leertaste um die Widerstände einzuordnen.",
        callback: () => {
            WA.nav.openCoWebSite('https://yungerikson.github.io/widerstand-minigame/'); //Erik
        }
    });

    setTimeout(() => {
        triggerMessage.remove();
    }, 1000);
});

/*WA.ui.modal.openModal({
    title: "WorkAdventure",
    src: "https://hardwarelabor.imn.htwk-leipzig.de/",
    allow: "fullscreen",
    allowApi: true,
    position: "center",
});
*/
