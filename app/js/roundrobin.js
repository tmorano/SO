sistemasOperacionais.factory('RoundRobinAlgorithmService', function ($interval, $rootScope) {
    var roundrobin = {};

    roundrobin.availableProcessors = [];
    roundrobin.availableAptos = [[], [], [], []];

    var ultimaFila = 0;

    //Busca o proximo apto
    var buscarProximoApto = function () {
        var apto;

        if (roundrobin.aptos) {
            if (ultimaFila < 4) {
                apto = roundrobin.aptos[ultimaFila].shift();
                ultimaFila += 1;
                if (!apto && (roundrobin.aptos[0].length || roundrobin.aptos[1].length || roundrobin.aptos[2].length || roundrobin.aptos[3].length)) {
                    apto = buscarProximoApto();
                }
            } else if (ultimaFila >= 4) {
                ultimaFila = 0;
                apto = buscarProximoApto();
            }
        }
        return apto;
    }

    //Executa o processo
    var execFunction = function (config) {
        var apto = buscarProximoApto();

        if (apto) {
            //Busca os objetos originais para que possam ser alterados na View
            var currentProcessor = roundrobin.availableProcessors.shift();
            var quantum = roundrobin.quantum;

            //Caso hajam processadores disponiveis
            if (currentProcessor) {
                var processador = config.processadores[currentProcessor.id];

                var pct;

                processador.estado = 'Executando';
                processador.processo = apto;

                // Quantum aleatorio de acordo com a prioridade
                processador.tempo = parseInt(quantum) + apto.prioridade;

                if (!processador.decreaseTime) {
                    processador.decreaseTime = $interval(function () {
                        if (processador.tempo && apto.tempo < apto.tempoTotal) {
                            if (processador.tempo - 1 > 0) {
                                processador.tempo -= 1;
                            } else {
                                processador.tempo = 0;
                            }

                            apto.state = 'Executando';
                            apto.tempo += 1;

                            pct = (apto.tempo / apto.tempoTotal) * 100;
                            apto.progress = Math.floor(pct);
                        } else {
                            $interval.cancel(processador.decreaseTime);
                            processador.estado = 'Parado';
                            processador.processo = undefined;
                            roundrobin.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                            processador.decreaseTime = undefined;
                            processador.tempo = 0;

                            //Caso ainda haja tempo, volta pra fila de aptos
                            if (apto.tempo < apto.tempoTotal) {
                                apto.state = 'Aguardando';
                                roundrobin.aptos[apto.prioridade].push(apto);
                            } else {
                                apto.progress = 100;
                                apto.state = 'Concluido';
                            }
                        }
                    }, 1000);
                }
            } //Caso nao haja processador, devolver o apto para a lista
            else {
                roundrobin.aptos[apto.prioridade].push(apto);
            }
        }
    };

    //Configura o servico
    roundrobin.configurar = function (config, aptos) {
        roundrobin.aptos = [[], [], [], []];
        roundrobin.quantum = config.quantum;
        roundrobin.config = config;
        roundrobin.availableProcessors = angular.copy(config.processadores);

        ultimaFila = 0;
    };

    roundrobin.executar = function () {
        var func = $interval(function () {
            //Nao esta mais em execucao
            if (!roundrobin.config.running) {
                $interval.cancel(func);
                return;
            }

            execFunction(roundrobin.config, func)
        }, 500);
    };

    // Cria processo especifico para o Round Robin
    roundrobin.createProcess = function (scopeProccesses) {
        var prioridade = getRandomNum(0,3);
        var pid = scopeProccesses.length;
        var proc = {
            pid: pid,
            processo: "Processo " + pid,
            progress: 0,
            state: 'Executando',
            prioridade: prioridade,
            tempo: 0,
            tempoTotal: getRandomNum(4,20)
        }

        roundrobin.aptos[prioridade].push(proc);
        scopeProccesses.push(proc);
        console.log("Adicionado processo " + proc.pid + " - " + roundrobin.aptos[prioridade].indexOf(proc));
        return proc;
    };

    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return roundrobin;
});