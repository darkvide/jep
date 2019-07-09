const pares = [];
const impares = [];
const x = 0;

function division(x) {
    for (let i = 1; i <= x; i++) {
        if (x % i == 0) {
            pares.push(i);
        } else {
            impares.push(i);
        }
    }
}

division(x);



const arbol = [];
for (let i = 0; i <= 100; i++) {
    arbol.join('*');
}