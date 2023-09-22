export default function sleep(ms){
//Esse código exporta uma função chamada sleep que recebe um argumento ms (milissegundos). 
//A função retorna uma Promise que irá resolver após o número de milissegundos especificados.
return new Promise((resolve) =>  setTimeout(resolve,ms))

}