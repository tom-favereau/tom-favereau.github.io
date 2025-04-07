class MultiTapeCellularAutomaton {
    constructor(length, alphabets, rule, boundaryType = "fixed", boundaryValue = 0, cellSize = 20, canvasSize = [800, 120]) {
        this.length = length;
        this.alphabets = alphabets;
        this.rule = rule;
        this.boundaryType = boundaryType;
        this.boundaryValue = boundaryValue;
        this.cellSize = cellSize;
        this.canvasWidth = canvasSize[0];
        this.canvasHeight = canvasSize[1];

        this.ribbons = this.randomConfig();
        this.running = false;
        this.paused = true;

        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    randomConfig() {
        return this.alphabets.map(alphabet =>
            Array.from({length: this.length}, () => alphabet[Math.floor(Math.random() * alphabet.length)])
        );
    }

    setBoundaryType(boundaryType, boundaryValue = 0) {
        this.boundaryType = boundaryType;
        this.boundaryValue = boundaryValue;
    }

    nextGeneration() {
        const newRibbons = this.ribbons.map(() => Array(this.length).fill(0));

        for (let i = 0; i < this.length; i++) {
            const left = this.ribbons.map((ribbon, r) =>
                this.boundaryType === "fixed"
                    ? (i > 0 ? ribbon[i - 1] : this.boundaryValue)
                    : (i > 0 ? ribbon[i - 1] : ribbon[this.length - 1])
            );
            const center = this.ribbons.map(ribbon => ribbon[i]);
            const right = this.ribbons.map((ribbon, r) =>
                this.boundaryType === "fixed"
                    ? (i < this.length - 1 ? ribbon[i + 1] : this.boundaryValue)
                    : (i < this.length - 1 ? ribbon[i + 1] : ribbon[0])
            );

            const newValues = this.rule(left, center, right);
            newValues.forEach((value, r) => newRibbons[r][i] = value);
        }

        this.ribbons = newRibbons;
    }

    reset() {
        this.ribbons = this.randomConfig();
        this.running = false;
        this.paused = true;
    }

    draw() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.ribbons.forEach((ribbon, r) => {
            ribbon.forEach((cell, col) => {
                const x = col * this.cellSize;
                const y = r * this.cellSize;

                if (typeof cell === 'number') {
                    this.ctx.fillStyle = cell === 1 ? 'black' : 'white';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                } else {
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = `${this.cellSize / 2}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(cell.toString(), x + this.cellSize / 2, y + this.cellSize / 2);
                }

                this.ctx.strokeStyle = 'black';
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            });
        });
    }

    run() {
        if (this.running && !this.paused) {
            this.nextGeneration();
        }
        this.draw();
        requestAnimationFrame(() => this.run());
    }
}

function tm(state, read) {
    const table = {
        sUpa: {
            '0': ['odd', 'a', 1],
            ' ': ['twin', ' ', 0]
        },
        odd: {
            '0': ['eve', '0', 1],
            ' ': ['notPrime', '0', -1]
        },
        eve: {
            '0': ['odd', '0', 1],
            ' ': ['odd', '0', 1]
        },
        sUp1: {
            '0': ['sUp2', '2', 1]
        },
        sUp2: {
            '0': ['rstart', '2', -1],
            ' ': ['twin', ' ', -1]
        },
        each: {
            'a': ['each', 'a', 1],
            'b': ['each', 'b', 1],
            '0': ['rstart', '0', -1],
            ' ': ['notPrime', ' ', 1],
            '1': ['each', '1', 1],
            '2': ['sep', '0', 1]
        },
        sep: {
            '2': ['sep', '2', 1],
            '1': ['sep', '1', 1],
            '0': ['next', '1', -1],
            ' ': ['repair', ' ', 1]
        },
        next: {
            '0': ['each', '2', 1],
            '1': ['next', '1', -1],
            '2': ['next', '2', -1]
        },
        rstart: {
            '1': ['rstart', '1', -1],
            '2': ['rstart', '2', -1],
            'a': ['each', 'a', 1],
            'b': ['each', 'b', 1]
        },
        repair: {
            ' ': ['repair', ' ', -1],
            '1': ['repair', '0', -1],
            '0': ['add2', '2', 1],
            '2': ['add2', '2', 1]
        },
        add2: {
            ' ': ['isPrime', ' ', 1],
            'a': ['each', 'a', 1],
            'b': ['each', 'b', 1],
            '0': ['add2', '2', -1],
            '2': ['add2', '2', -1]
        },
        isPrime: {
            ' ': ['isPrime', '0', -1],
            '1': ['isPrime', '0', -1],
            '2': ['isPrime', '0', -1],
            'a': ['sUp1', 'b', 1],
            'b': ['twin', 'b', 1],
            '0': ['isPrime', '0', -1]
        },
        notPrime: {
            ' ': ['notPrime', '0', -1],
            '1': ['notPrime', '0', -1],
            '2': ['notPrime', '0', -1],
            'a': ['sUp1', 'a', 1],
            'b': ['sUp1', 'a', 1],
            '0': ['notPrime', '0', -1]
        },
        twin: {

            'a': ['twin', 'a', 0],
            'b': ['twin', 'b', 0],
            '0': ['twin', '0', 0],
            '1': ['twin', '1', 0],
            '2': ['twin', '2', 0],
            ' ': ['twin', ' ', 0]
        }
    };

    if (table[state] && table[state][read]) {
        return table[state][read];
    } else {
        // problem
        return [state, read, 0];
    }
}

const stateMap = {
    'sUpa': 'q1',
    'odd': 'q2',
    'eve': 'q3',
    'sUp1': 'q4',
    'sUp2': 'q5',
    'each': 'q6',
    'sep': 'q7',
    'next': 'q8',
    'rstart': 'q9',
    'repair': 'q10',
    'add2': 'q11',
    'isPrime': 'q12',
    'notPrime': 'q13',
    'twin': 'qh'
};

const reverseStateMap = Object.fromEntries(
    Object.entries(stateMap).map(([key, value]) => [value, key])
);

function rule(left, center, right) {
    const [left1, left2, left3, left4] = left;
    const [center1, center2, center3, center4] = center;
    const [right1, right2, right3, right4] = right;

    let new1 = center1;
    let new2 = center2;
    let new3 = center3;
    let new4 = center4;

    if (center2 !== " ") {
        const [q, b, m] = tm(reverseStateMap[center2], center3);
        if (m === -1 && center1 === "<" && left1 === "<") {
            new2 = " ";
            new3 = b;
        } else if (m === -1 && center1 === ">" && left1 === ">") {
            new2 = " ";
            new3 = b;
        } else if (m === 1 && center1 === "<" && right1 === "<") {
            new2 = " ";
            new3 = b;
        } else if (m === 1 && center1 === ">" && right1 === ">") {
            new2 = " ";
            new3 = b;
        } else if (m === 0 && center1 === ">" && right1 === ">"){
            new2 = stateMap[q];
            new3 = b;
        } else if (m === 0 && center1 === "<" && right1 === "<"){
            new2 = stateMap[q];
            new3 = b;
        }
    }
    if (center2 === " " && right2 !== " ") {
        const [q, c, m] = tm(reverseStateMap[right2], right3);
        if (m === -1 && center1 === "<" && right1 === "<") {
            new2 = stateMap[q];
        } else if (m === -1 && center1 === ">" && right1 === ">") {
            new2 = stateMap[q];
        }
    }
    if (center2 === " " && left2 !== " ") {
        const [q, c, m] = tm(reverseStateMap[left2], left3);
        if (m === 1 && center1 === "<" && left1 === "<") {
            new2 = stateMap[q];
        } else if (m === 1 && center1 === ">" && left1 === ">") {
            new2 = stateMap[q];
        }
    }
    if ((center1 === "xl" || center1 === "x0") && left1 === ">" && center2 !== "qh"){
        new1 = "<"
    }
    if (center1 === "xr" && (right1 === "<" || right1 === " " && center2 !== "qh")){
        new1 = ">"
    }
    if ((center1 === "xl" || center1 === "x0") && (left1 === "<" || left1 === "xl"
        || left1 === "x0" || left1 === "xr" || left1 === " ") && center2 !== "qh"){
        new1 = "xr"
    }
    if (center1 === "xr" && (right1 === ">" || right1 === "xl" || right1 === "x0"
        || right1 === "xr") && center2 !== "qh"){
        new1 = "xl"
    }
    if (center1 === " " && left1 === "xr" && center2 !== "qh"){
        new1 = "x0"
    }
    if ((center1 === "xl" || center1 === "xr" || center1 === "x0")
        && center2 === "qh"){
        new1 = " "
    }
    if (center1 === ">" && right1 === " "){
        new1 = " "
    }
    if (center1 === "<" && left1 === " "){
        new1 = " "
    }
    if (center1 === ">" && right1 === "<"){
        new1 = "xr"
    }
    if (center1 === "<" && left1 === "xr"){
        new1 = "xr"
    }
    if (center1 === ">" && right1 === "xl" && right2 !== "qh"){
        new1 = "xl"
    }
    if (center1 === ">" && right1 === "x0" && right2 !== "qh"){
        new1 = "x0"
    }
    if (center1 === " "){
        new2 = " "
        new3 = " "
        new4 = " "
    }
    if (center1 === "x0" && center2 !== "qh" && left1 === ">"){
        new2 = " "
        new3 = center4
    }
    if (center1 === "x0" && center2 !== "qh" && left1 !== ">"){
        new2 = "q1"
        new3 = center4
    }
    if (center4 !== " " && left4 === " " && center1 === "<"){
        new4 = " "
    }



    return [new1, new2, new3, new4];
}

const automaton = new MultiTapeCellularAutomaton(
    40,
    [
        ["<", ">", "xr", "xl", "x0", " "],
        [" ", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "qh"],
        [" ", "0", "1", "a", "b"],
        [" ", "0"]
    ],
    rule,
    "periodic",
    0,
    20,
    [800, 120]
);

document.getElementById('reset').addEventListener('click', () => automaton.reset());
document.getElementById('step').addEventListener('click', () => automaton.nextGeneration());
document.getElementById('start').addEventListener('click', () => { automaton.running = true; automaton.paused = false; });
document.getElementById('pause').addEventListener('click', () => automaton.paused = true);
document.getElementById('boundaryToggle').addEventListener('change', function() {
    if (this.checked) {
        automaton.setBoundaryType("periodic");
        document.getElementById('boundaryType').textContent = "Periodic";
    } else {
        automaton.setBoundaryType("fixed", 0);
        document.getElementById('boundaryType').textContent = "Fixed";
    }
});


document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'r': automaton.reset(); break;
        case 's': automaton.nextGeneration(); break;
        case 'n': automaton.running = true; automaton.paused = false; break;
        case 'p': automaton.paused = true; break;
        case 'b': // 'b' for boundary
            const toggle = document.getElementById('boundaryToggle');
            toggle.checked = !toggle.checked;
            toggle.dispatchEvent(new Event('change'));
            break;
    }
});

automaton.run();