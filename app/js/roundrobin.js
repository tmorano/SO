sistemasOperacionais.factory('RoundRobinAlgorithmService', function ($interval) {
    var roundrobin = {};

    var ultimaFilaProcessada = 0;

    roundrobin.availableProcessors = [];

    //Configura o servico especifico de Round Robin
    roundrobin.configurar = function (config) {
        //Inclui fila de prioridade
        roundrobin.filaDePrioridade = [[], [], [], []];
        //Quantum
        roundrobin.quantum = config.quantum;
        //Configuracoes do index
        roundrobin.config = config;
        // Processadores do Programa
        roundrobin.availableProcessors = angular.copy(config.cores);
    };

    // Cria processo especifico para o Round Robin
    roundrobin.createProcess = function (scopeProccesses) {
        var prioridade = getRandomNum(0,3);
        var pid = scopeProccesses.length;
        var proc = {
            pid: pid,
            processo: "Processo " + pid,
            progress: 0,
            state: 'Pronto',
            prioridade: prioridade,
            tempoExecutado: 0,
            tempoTotal: getRandomNum(4,20)
        }

        //Adiciona na fila de prioridades
        roundrobin.filaDePrioridade[prioridade].push(proc);
        scopeProccesses.push(proc);
        //Retorna processo para scope
        return proc;
    };

    roundrobin.executar = function () {
        var func = $interval(function () {
            // Verifica se o algoritmo esta rodando
            if (!roundrobin.config.running) {
                $interval.cancel(func);
                return;
            }

            execFunction(roundrobin.config, func)
        }, -1);
    };

    //Executa o processo
    var execFunction = function (config) {
        var processo = buscarProximoProcesso();

        if (processo) {
            //Busca os objetos originais para que possam ser alterados na View
            var currentProcessor = roundrobin.availableProcessors.shift();
            var quantum = roundrobin.quantum;

            //Caso hajam processadores disponiveis
            if (currentProcessor) {
                var processador = config.cores[currentProcessor.id];

                processador.state = 'Executando';
                processador.processo = processo;
                processador.tempo = quantum;

                if (!processador.decreaseTime) {
                    processador.decreaseTime = $interval(function () {
                        if (processador.tempo && processo.tempoExecutado < processo.tempoTotal) {
                            if (processador.tempo - 1 > 0) {
                                processador.tempo -= 1;
                            } else {
                                processador.tempo = 0;
                            }

                            processo.state = 'Executando';
                            processo.tempoExecutado += 1;
                            processo.progress = Math.floor((processo.tempoExecutado / processo.tempoTotal) * 100);
                        } else {
                            $interval.cancel(processador.decreaseTime);
                            processador.state = 'Parado';
                            processador.processo = undefined;
                            roundrobin.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                            processador.decreaseTime = undefined;
                            processador.tempo = 0;

                            //Verifica se processo foi concluido
                            if (processo.tempoExecutado < processo.tempoTotal) {
                                processo.state = 'Aguardando';
                                roundrobin.filaDePrioridade[processo.prioridade].push(processo);
                            } else {
                                processo.progress = 100;
                                processo.state = 'Concluido';
                            }
                        }
                    }, 1000);
                }
            } //Caso nao haja processador, devolver o apto para a lista
            else {
                roundrobin.filaDePrioridade[processo.prioridade].push(processo);
            }
        }
    };

    var buscarProximoProcesso = function () {
        var processo;

        if (roundrobin.filaDePrioridade) {
            if (ultimaFilaProcessada < 4) {
                processo = roundrobin.filaDePrioridade[ultimaFilaProcessada].shift();
                ultimaFilaProcessada += 1;
                if (!processo && (roundrobin.filaDePrioridade[0].length || roundrobin.filaDePrioridade[1].length || roundrobin.filaDePrioridade[2].length || roundrobin.filaDePrioridade[3].length)) {
                    processo = buscarProximoProcesso();
                }
            } else if (ultimaFilaProcessada >= 4) {
                ultimaFilaProcessada = 0;
                processo = buscarProximoProcesso();
            }
        }
        return processo;
    }




    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return roundrobin;
});