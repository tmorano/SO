sistemasOperacionais.factory('BestFitService', function () {
    var bestFit = {};
    
     bestFit.iniciarMemoria = function (args) {
         bestFit.config = args;


    }
    
    bestFit.adicionarNaMemoria = function (processo) {
        console.log("Adicionando Memoria");

        bestFit.config.totalMemory -= processo.memory;

    }

    bestFit.encerrarProcesso = function(processo){
        console.log("Devolvendo memoria");
        bestFit.config.totalMemory += processo.memory;
    }

    return bestFit;
});