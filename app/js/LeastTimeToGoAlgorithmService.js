sistemasOperacionais.factory('LeastTimeToGoAlgorithmService', function ($interval) {
    var ltg = {};

        ltg.availableProcessors = [];

    ltg.configurar = function(config){
        //Inclui fila de prioridade ordenado pelo deadLine
        ltg.filaDePrioridade = [];
        //Configuracoes do index
        ltg.config = config;
        // Processadores do Programa
        ltg.availableProcessors = angular.copy(config.cores);
    }


    ltg.createProcess = function(scopeProccesses){
        var pid = scopeProccesses.length;
        var proc = {
            pid: pid,
            processo: "Processo " + pid,
            progress: 0,
            state: 'Pronto',
            tempoExecutado: 0,
            tempoTotal: getRandomNum(4,20),
            deadLine : getRandomNum(4,20)
        }
        var deadLine = proc.deadLine;
        proc.deadLineOriginal = deadLine;

        //Adiciona na fila de prioridades
        ltg.filaDePrioridade.push(proc);
        insertionSort(ltg.filaDePrioridade)

        scopeProccesses.push(proc);
    }


    ltg.executar = function(){
        var func = $interval(function () {
            // Verifica se o algoritmo esta rodando
            if (!ltg.config.running) {
                $interval.cancel(func);
                return;
            }
            execLTG(ltg.config)
        }, 1000);
    }



    var execLTG = function(config){

        var processo = buscarProximoProcesso();

        if (processo) {
            var currentProcessor = ltg.availableProcessors.shift();

            if (currentProcessor) {
                var core = config.cores[currentProcessor.id];

                core.state = 'Executando';
                core.processo = processo;
                core.tempo = processo.tempoTotal;
                core.executando = false;

                if (core.executando == false) {
                    core.executando = $interval(function () {

                        // Decrementando o DeadLine dos processos
                        ltg.filaDePrioridade.forEach(function (eachProcesso) {
                            if(eachProcesso.state != 'Executando' && eachProcesso.deadLine == 0){
                                eachProcesso.state = 'Abortado';
                                eachProcesso.progressStyle = 'danger';
                                eachProcesso.progress = 100;
                            }else{
                                eachProcesso.deadLine -=1;
                            }
                        })
                        // Verifica se o core esta executando, se o ainda falta tempo no processo e verifica se o estado nao eh abortado.
                        if (!(core.tempo && processo.tempoExecutado < processo.tempoTotal && processo.state != 'Abortado')) {
                            $interval.cancel(core.executando);
                            ltg.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                            core.state = 'Parado';
                            core.processo = undefined;
                            core.executando = false;
                            core.tempo = 0;
                            //Processo sera executado ate o fim sem aguardar (Algoritmo nao preemptivo)
                            if (processo.tempoExecutado == processo.tempoTotal) {
                                processo.progress = 100;
                                processo.state = 'Concluido';
                                processo.progressStyle = 'success';
                            }

                        } else {
                            if (core.tempo - 1 > 0) {
                                core.tempo -= 1;
                            } else {
                                core.tempo = 0;
                            }

                            processo.state = 'Executando';
                            processo.progressStyle = 'default';
                            processo.tempoExecutado += 1;
                            processo.progress = Math.floor((processo.tempoExecutado / processo.tempoTotal) * 100);
                        }
                    }, 1000);
                }
            }else if(processo.state != 'Executando'){
                ltg.filaDePrioridade.push(processo);
                insertionSort(ltg.filaDePrioridade)
            }
        }


    }

    var buscarProximoProcesso = function () {

        var processo = ltg.filaDePrioridade.shift();
        if(processo && processo.state == 'Abortado'){
            processo = buscarProximoProcesso();
        }

     return processo;
    }

    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // http://codingmiles.com/sorting-algorithms-insertion-sort-using-javascript/

    function insertionSort(processos) {
        var len = processos.length;
        for (var i = 0; i < len ; i++) {
            var tmp = processos[i].deadLine; //Copy of the current element.
            var processostmp = processos[i];
            /*Check through the sorted part and compare with the number in tmp. If large, shift the number*/
            for (var j = i - 1; j >= 0 && (processos[j].deadLine > tmp); j--) {
                //Shift the number
                processos[j + 1] = processos[j];
            }
            //Insert the copied processo at the correct position
            //in sorted part.
            processos[j + 1] = processostmp;
        }
    }

    return ltg;

});
