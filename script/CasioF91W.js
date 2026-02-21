class CasioF91W {
    os;
    onButtonClick;

    constructor() {

        this.os = new CasioF91WOperatingSystem();

        const buttonL = document.querySelector("#buttonL"),
              buttonC = document.querySelector("#buttonC"),
              buttonA = document.querySelector("#buttonA");

        buttonL.addEventListener("mousedown", e => {
            this.os.buttonL(true);
        });

        buttonL.addEventListener("mouseup", e => {
            this.os.buttonL(false);
            if (typeof this.onButtonClick === "function") this.onButtonClick();
        });
        
        buttonC.addEventListener("mousedown", e => {
            this.os.buttonC(true);
        });

        buttonC.addEventListener("mouseup", e => {
            this.os.buttonC(false);
            if (typeof this.onButtonClick === "function") this.onButtonClick();
        });
        
        buttonA.addEventListener("mousedown", e => {
            this.os.buttonA(true);
        });

        buttonA.addEventListener("mouseup", e => {
            this.os.buttonA(false);
            if (typeof this.onButtonClick === "function") this.onButtonClick();
        });
    }
}

class CasioF91WDigitalDisplay {
    displayEl;

    constructor() {
        this.displayEl = document.querySelector("#CasioF91WSVG");
    }

    charToSegments(id, char) {
        const displays = {
            "mode_2": 9,
            "mode_1": 8,
            "day_2": 7,
            "day_1": 7,
            "hour_2": 7,
            "hour_1": 7,
            "minute_2": 7,
            "minute_1": 7,
            "second_2": 7,
            "second_1": 7,
        };

        if (!(id in displays)) {
            throw new Error(`Given ID '${id}' is not supported.`);
        }

        let segments = {
            0: ["A", "B", "C", "D", "E", "F"],
            1: ["B", "C"],
            2: ["A", "B", "D", "E", "G"],
            3: ["A", "B", "C", "D", "G"],
            4: ["B", "C", "F", "G"],
            5: ["A", "C", "D", "F", "G"],
            6: ["A", "C", "D", "E", "F", "G"],
            7: ["A", "B", "C"],
            8: ["A", "B", "C", "D", "E", "F", "G"],
            9: ["A", "B", "C", "D", "F", "G"],
            "A": ["A", "B" ,"C", "E", "F", "G"],
            "C": ["A", "D", "E", "F"],
            "E": ["A", "D", "E", "F", "G"],
            "F": ["A", "E", "F", "G"],
            "H": ["B", "C", "E", "F", "G"],
            "I": ["B", "C"],
            "L": ["D", "E", "F"],
            "O": ["A", "B", "C", "D", "E", "F"],
            "S": ["A", "C", "D", "F", "G"],
            "U": ["B", "C", "D", "E", "F"],
            " ": [],
        };

        if (displays[id] === 8) {
            segments["T"] = ["A", "E", "F", "H"];
            segments["R"] = ["A", "B", "C", "E", "F", "G", "H"];
        } else if (displays[id] === 9) {
            segments["M"] = ["A", "B", "C", "E", "F", "H", "I"];
            segments["T"] = ["A", "H", "I"];
            segments["H"] = ["B", "C", "E", "F", "G"];
            segments["W"] = ["B", "C", "D", "E", "F", "H", "I"];
        }

        if (!(char in segments)) {
            throw new Error(`Given character '${char}' is not supported on '${id}' ${displays[id]} segments displays.`);
        }

        for (const segment of ["A", "B", "C", "D", "E", "F", "G", "H", "I"]) {
            if (segments[char].includes(segment)) {
                this.displayScreen(id + "_" + segment, true);
            } else {
                this.displayScreen(id + "_" + segment, false);
            }
        }
    }

    displayScreen(id, display) {
        const el = this.displayEl.querySelector("#" + id);
        if (!!el) {
            const opacity = id === "light" ? "0.4" : "1";
            el.style.opacity = display ? opacity : "0";
        }
    }
}

class CasioF91WOperatingSystem {
    systemClock;
    displayFrameRate;
    activeMenu;
    activeAction;
    dateTime;
    dateTimeOffset;
    dailyAlarmDateTime;
    alarmOnMark;
    timeSignalOnMark;
    timeMode;
    lap;
    stopwatchDateTime;
    stopwatchDateTimeSplit;
    stopwatchInterval;
    buttonTimeout;
    buttonInterval;
    bip;
    display = {};
    digitalDisplay;

    constructor() {
        this.systemClock = 20;
        this.displayFrameRate = 20;

        this.dateTime = new Date();
        this.dateTimeOffset = 0;

        this.dailyAlarmDateTime = new Date();
        this.dailyAlarmDateTime.setHours(7);
        this.dailyAlarmDateTime.setMinutes(0);
        this.dailyAlarmDateTime.setSeconds(0);

        this.stopwatchDateTime = new Date();
        this.stopwatchDateTime.setMinutes(0);
        this.stopwatchDateTime.setSeconds(0);
        this.stopwatchDateTime.setMilliseconds(0);

        this.activeMenu = "dateTime";
        this.activeAction = "default";

        this.timeMode = "24";

        this.alarmOnMark = false;
        this.timeSignalOnMark = false;

        this.lap = false;

        this.bip = new Audio("sound/bip.mp3");

        this.digitalDisplay = new CasioF91WDigitalDisplay();

        setInterval(() => {
            this.dateTime = new Date(new Date().getTime() + this.dateTimeOffset);
        }, this.systemClock);

        setInterval(() => {
            this.display.light = this.light;

            if (this.activeMenu === "dateTime") {
                this.display.lap = false;
                this.display.dots = true;
                if (this.activeAction === "default") {
                    let dayLetters = this.dateTime.toLocaleDateString("en-US", {weekday: 'long'}).slice(0, 2).toUpperCase();
                    const day = this.dateTime.getDate();
                    let hours = this.dateTime.getHours();
                    hours = this.timeMode === "12" && hours > 12 ? hours - 12 : hours;
                    const minutes = this.dateTime.getMinutes();
                    const seconds = this.dateTime.getSeconds();

                    this.display.alarmOnMark = this.alarmOnMark;
                    this.display.timeSignalOnMark = this.timeSignalOnMark;
                    this.display.timeMode24 = this.timeMode === "24";
                    this.display.timeMode12 = this.timeMode === "12";
                    this.display.mode_2 = dayLetters[0];
                    this.display.mode_1 = dayLetters[1];
                    this.display.day_2 = day > 9 ? day.toString().charAt(0) : " ";
                    this.display.day_1 = day.toString().slice(-1);
                    this.display.hour_2 = hours > 9 ? hours.toString().charAt(0) : " ";
                    this.display.hour_1 = hours.toString().slice(-1);
                    this.display.minute_2 = minutes > 9 ? minutes.toString().charAt(0) : 0;
                    this.display.minute_1 = minutes.toString().slice(-1);
                    this.display.second_2 = seconds > 9 ? seconds.toString().charAt(0) : 0;
                    this.display.second_1 = seconds.toString().slice(-1);
                } else if (this.activeAction === "casio") {
                    this.display.alarmOnMark = false;
                    this.display.timeSignalOnMark = false;
                    this.display.timeMode24 = false;
                    this.display.timeMode12 = false;
                    this.display.lap = false;
                    this.display.dots = false;
                    this.display.mode_2 = " ";
                    this.display.mode_1 = " ";
                    this.display.day_2 = " ";
                    this.display.day_1 = " ";
                    this.display.hour_2 = "C";
                    this.display.hour_1 = "A";
                    this.display.minute_2 = "S";
                    this.display.minute_1 = "I";
                    this.display.second_2 = "O";
                    this.display.second_1 = " ";
                }
            } else if (this.activeMenu === "dailyAlarm") {
                const hours = this.dailyAlarmDateTime.getHours();
                const minutes = this.dailyAlarmDateTime.getMinutes();

                this.display.alarmOnMark = this.alarmOnMark;
                this.display.timeSignalOnMark = this.timeSignalOnMark;
                this.display.timeMode24 = false;
                this.display.timeMode12 = false;
                this.display.lap = false;
                this.display.dots = true;
                this.display.mode_2 = "A";
                this.display.mode_1 = "L";
                this.display.day_2 = " ";
                this.display.day_1 = " ";
                this.display.hour_2 = hours > 9 ? hours.toString().charAt(0) : " ";
                this.display.hour_1 = hours.toString().slice(-1);
                this.display.minute_2 = minutes > 9 ? minutes.toString().charAt(0) : 0;
                this.display.minute_1 = minutes.toString().slice(-1);
                this.display.second_2 = " ";
                this.display.second_1 = " ";

                if (this.activeAction === "edit-hours" && this.getBlinkingState()) {
                    this.display.hour_2 = " ";
                    this.display.hour_1 = " ";
                } else if (this.activeAction === "edit-minutes" && this.getBlinkingState()) {
                    this.display.minute_2 = " ";
                    this.display.minute_1 = " ";
                }
            } else if (this.activeMenu === "stopwatch") {
                let currentStopwatchDateTime = null;

                if (this.stopwatchDateTimeSplit) {
                    currentStopwatchDateTime = this.stopwatchDateTimeSplit;
                } else {
                    currentStopwatchDateTime = this.stopwatchDateTime;
                }
                const minutes = currentStopwatchDateTime.getMinutes();
                const seconds = currentStopwatchDateTime.getSeconds();
                let milliseconds = currentStopwatchDateTime.getMilliseconds();
                milliseconds = ("00" + milliseconds.toString()).slice(-3);

                this.display.alarmOnMark = this.alarmOnMark;
                this.display.timeSignalOnMark = this.timeSignalOnMark;
                this.display.timeMode24 = false;
                this.display.timeMode12 = false;
                this.display.lap = this.lap;
                this.display.dots = true;
                this.display.mode_2 = "S";
                this.display.mode_1 = "T";
                this.display.day_2 = " ";
                this.display.day_1 = " ";
                this.display.hour_2 = minutes > 9 ? minutes.toString().charAt(0) : " ";
                this.display.hour_1 = minutes.toString().slice(-1);
                this.display.minute_2 = seconds > 9 ? seconds.toString().charAt(0) : 0;
                this.display.minute_1 = seconds.toString().slice(-1);
                this.display.second_2 = milliseconds.charAt(0);
                this.display.second_1 = milliseconds.charAt(1);
            } else if (this.activeMenu === "setDateTime") {
                let dayLetters = this.dateTime.toLocaleDateString("en-US", {weekday: 'long'}).slice(0, 2).toUpperCase();
                const day = this.dateTime.getDate();
                let hours = this.dateTime.getHours();
                hours = this.timeMode === "12" && hours > 12 ? hours - 12 : hours;
                const minutes = this.dateTime.getMinutes();
                const seconds = this.dateTime.getSeconds();

                this.display.alarmOnMark = this.alarmOnMark;
                this.display.timeSignalOnMark = this.timeSignalOnMark;
                this.display.timeMode24 = this.timeMode === "24";
                this.display.timeMode12 = this.timeMode === "12";
                this.display.lap = false;
                this.display.mode_2 = dayLetters[0];
                this.display.mode_1 = dayLetters[1];
                this.display.day_2 = day > 9 ? day.toString().charAt(0) : " ";
                this.display.day_1 = day.toString().slice(-1);

                if (["edit-month", "edit-day-number", "edit-day-letter"].includes(this.activeAction)) {
                    const month = this.dateTime.getMonth() + 1;
                    this.display.dots = false;
                    this.display.hour_2 = month > 9 ? month.toString().charAt(0) : " ";
                    this.display.hour_1 = month.toString().slice(-1);
                    this.display.minute_2 = " ";
                    this.display.minute_1 = " ";
                    this.display.second_2 = " ";
                    this.display.second_1 = " ";
                } else {
                    this.display.dots = true;
                    this.display.hour_2 = hours > 9 ? hours.toString().charAt(0) : " ";
                    this.display.hour_1 = hours.toString().slice(-1);
                    this.display.minute_2 = minutes > 9 ? minutes.toString().charAt(0) : 0;
                    this.display.minute_1 = minutes.toString().slice(-1);
                    this.display.second_2 = seconds > 9 ? seconds.toString().charAt(0) : 0;
                    this.display.second_1 = seconds.toString().slice(-1);
                }

                if (this.getBlinkingState()) {
                    if (this.activeAction === "default") {
                        this.display.second_2 = " ";
                        this.display.second_1 = " ";
                    } else if (this.activeAction === "edit-minutes") {
                        this.display.minute_2 = " ";
                        this.display.minute_1 = " ";
                    } else if (this.activeAction === "edit-hours") {
                        this.display.hour_2 = " ";
                        this.display.hour_1 = " ";
                    } else if (this.activeAction === "edit-month") {
                        this.display.hour_2 = " ";
                        this.display.hour_1 = " ";
                    } else if (this.activeAction === "edit-day-number") {
                        this.display.day_2 = " ";
                        this.display.day_1 = " ";
                    } else if (this.activeAction === "edit-day-letter") {
                        this.display.mode_2 = " ";
                        this.display.mode_1 = " ";
                    }
                }
            }

            this.digitalDisplay.displayScreen("alarmOnMark", this.display.alarmOnMark);
            this.digitalDisplay.displayScreen("timeSignalOnMark", this.display.timeSignalOnMark);
            this.digitalDisplay.displayScreen("timeMode24", this.display.timeMode24);
            this.digitalDisplay.displayScreen("timeMode12", this.display.timeMode12);
            this.digitalDisplay.displayScreen("lap", this.display.lap);
            this.digitalDisplay.displayScreen("dots", this.display.dots);
            this.digitalDisplay.displayScreen("light", this.display.light);

            this.digitalDisplay.charToSegments("mode_2", this.display.mode_2);
            this.digitalDisplay.charToSegments("mode_1", this.display.mode_1);

            this.digitalDisplay.charToSegments("day_2", this.display.day_2);
            this.digitalDisplay.charToSegments("day_1", this.display.day_1);

            this.digitalDisplay.charToSegments("hour_2", this.display.hour_2);
            this.digitalDisplay.charToSegments("hour_1", this.display.hour_1);
            this.digitalDisplay.charToSegments("minute_2", this.display.minute_2);
            this.digitalDisplay.charToSegments("minute_1", this.display.minute_1);
            this.digitalDisplay.charToSegments("second_2", this.display.second_2);
            this.digitalDisplay.charToSegments("second_1", this.display.second_1);

        }, this.displayFrameRate);
    }

    buttonL(isDown) {
        if (this.activeMenu === "dateTime") {
            // no action
        } else if (this.activeMenu === "dailyAlarm") {
            if (isDown) {
                if (this.activeAction === "default") {
                    this.alarmOnMark = true;
                    this.activeAction = "edit-hours";
                } else if (this.activeAction === "edit-hours") {
                    this.activeAction = "edit-minutes";
                } else if (this.activeAction === "edit-minutes") {
                    this.activeAction = "default";
                } else {
                    console.warn(`'activeAction': '${this.activeAction}' not supported.`);
                }
            }
        } else if (this.activeMenu === "stopwatch") {
            if (isDown) {
                if (this.stopwatchInterval) {
                    if (this.stopwatchDateTimeSplit) {
                        this.stopwatchDateTimeSplit = null;
                        this.lap = false;
                    } else {
                        this.stopwatchDateTimeSplit = new Date(this.stopwatchDateTime);
                        this.lap = true;
                    }
                } else {
                    if (this.stopwatchDateTimeSplit) {
                        this.stopwatchDateTimeSplit = null;
                        this.lap = false;
                    } else {
                        this.stopwatchDateTime = new Date();
                        this.stopwatchDateTime.setMinutes(0);
                        this.stopwatchDateTime.setSeconds(0);
                        this.stopwatchDateTime.setMilliseconds(0);
                    }
                }
            }
        } else if (this.activeMenu === "setDateTime") {
            if (isDown) {
                if (this.activeAction === "default") {
                    this.activeAction = "edit-minutes";
                } else if (this.activeAction === "edit-minutes") {
                    this.activeAction = "edit-hours";
                } else if (this.activeAction === "edit-hours") {
                    this.activeAction = "edit-month";
                } else if (this.activeAction === "edit-month") {
                    this.activeAction = "edit-day-number";
                } else if (this.activeAction === "edit-day-number") {
                    this.activeAction = "default";
                } else {
                    console.warn(`'activeAction': '${this.activeAction}' not supported.`);
                }
            }
        }

        if (isDown) {
            this.light = true;
            document.body.classList.add("light-on");
        } else {
            this.light = false;
            document.body.classList.remove("light-on");
        }
    }

    buttonC(isDown) {
        if (this.activeMenu === "dateTime") {
            if (isDown) {
                this.activeMenu = "dailyAlarm";
                this.activeAction = "default";
            }
        } else if (this.activeMenu === "dailyAlarm") {
            if (isDown) {
                this.activeMenu = "stopwatch";
                this.activeAction = "default";
            }
        } else if (this.activeMenu === "stopwatch") {
            if (isDown) {
                this.activeMenu = "setDateTime";
                this.activeAction = "default";
            }
        } else if (this.activeMenu === "setDateTime") {
            if (isDown) {
                this.activeMenu = "dateTime";
                this.activeAction = "default";
            }
        }

        if (isDown) {
            this.playBip();
        }
    }

    buttonA(isDown) {
        if (this.activeMenu === "dateTime") {
            if (isDown) {
                this.buttonInterval = setTimeout(() => {
                    this.activeAction = "casio";
                    this.timeMode = this.timeMode === "24" ? "12" : "24";
                }, 3000);
            } else {
                clearTimeout(this.buttonInterval);
                this.activeAction = "default";
                this.timeMode = this.timeMode === "24" ? "12" : "24";
            }
        } else if (this.activeMenu === "dailyAlarm") {
            if (this.activeAction === "default") {
                if (isDown) {
                    if (this.alarmOnMark && this.timeSignalOnMark) {
                        this.alarmOnMark = false;
                        this.timeSignalOnMark = false;
                    } else if (this.alarmOnMark) {
                        this.alarmOnMark = false;
                        this.timeSignalOnMark = true;
                    } else if (this.timeSignalOnMark) {
                        this.alarmOnMark = true;
                        this.timeSignalOnMark = true;
                    } else {
                        this.alarmOnMark = true;
                        this.timeSignalOnMark = false;
                    }
                    this.playBip();
                }
            } else if (["edit-hours", "edit-minutes"].includes(this.activeAction)) {
                const increment = () => {
                    if (this.activeAction === "edit-hours") {
                        this.dailyAlarmDateTime.setHours(this.dailyAlarmDateTime.getHours() + 1);
                    } else if (this.activeAction === "edit-minutes") {
                        this.dailyAlarmDateTime.setMinutes(this.dailyAlarmDateTime.getMinutes() + 1);
                    }
                }

                if (isDown) {
                    increment();
                    this.buttonTimeout = setTimeout(() => {
                        increment();
                        this.buttonInterval = setInterval(() => {
                            increment();
                        }, 100);
                    }, 1000);
                } else {
                    clearTimeout(this.buttonTimeout);
                    clearInterval(this.buttonInterval);
                }
            }
        } else if (this.activeMenu === "stopwatch") {
            if (isDown) {
                if (this.stopwatchInterval) {
                    clearInterval(this.stopwatchInterval);
                    this.stopwatchInterval = null;
                } else {
                    this.stopwatchInterval = setInterval(() => {
                        this.stopwatchDateTime.setMilliseconds(this.stopwatchDateTime.getMilliseconds() + 10);
                    }, 10);
                }
                this.playBip();
            }
        } else if (this.activeMenu === "setDateTime") {
            const increment = () => {
                let dateCopy = new Date(this.dateTime);
                if (this.activeAction === "default") {
                    dateCopy.setSeconds(dateCopy.getSeconds() + 1);
                } else if (this.activeAction === "edit-minutes") {
                    dateCopy.setMinutes(dateCopy.getMinutes() + 1);
                } else if (this.activeAction === "edit-hours") {
                    dateCopy.setHours(dateCopy.getHours() + 1);
                } else if (this.activeAction === "edit-month") {
                    dateCopy.setMonth(dateCopy.getMonth() + 1);
                } else if (this.activeAction === "edit-day-number") {
                    dateCopy.setDate(dateCopy.getDate() + 1);
                }
                this.dateTimeOffset -= this.dateTime.getTime() - dateCopy.getTime();
            }

            if (isDown) {
                increment();
                this.buttonTimeout = setTimeout(() => {
                    increment();
                    this.buttonInterval = setInterval(() => {
                        increment();
                    }, 100);
                }, 1000);
            } else {
                clearTimeout(this.buttonTimeout);
                clearInterval(this.buttonInterval);
            }
        }
    }

    getBlinkingState() {
        let isDisplayed;
        const milliseconds = this.dateTime.getMilliseconds();

        if (milliseconds < 250) {
            isDisplayed = false;
        } else if (milliseconds < 500) {
            isDisplayed = true;
        } else if (milliseconds < 750) {
            isDisplayed = false;
        } else {
            isDisplayed = true;
        }

        return isDisplayed;
    }

    playBip() {
        this.bip.pause();
        this.bip.currentTime = 0;
        this.bip.play();
    }
}
