sistemasOperacionais.factory('RoundRobinAlgorithmService', function ($interval) {
    var roundrobin = {};

    roundrobin.ultimaFilaProcessada = 0;
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

        config.filaDePrioridade = roundrobin.filaDePrioridade;


    };

    roundrobin.req = 0;

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
            tempoTotal: getRandomNum(4,20),
            memory : getRandomNum(2, 128),
            chance: function(){
                // chance de aumentar memória
                return Math.random() > 0.89
            }
        };

        //Adiciona na fila de prioridades
        roundrobin.filaDePrioridade[prioridade].push(proc);
        scopeProccesses.push(proc);
        //Retorna processo para scope
        return proc;
    };

    roundrobin.executar = function (memoryService, memorySwapping) {
        var func = $interval(function () {
            // Verifica se o algoritmo esta rodando
            if (!roundrobin.config.running) {
                $interval.cancel(func);
                return;
            }
            execRoundRobin(roundrobin.config, memoryService, memorySwapping)
        }, 500);
    };


    //Executa o processo
    var execRoundRobin = function (config, memoryService, memorySwapping) {
        var processo = buscarProximoProcesso();

        if (processo) {
            //Busca os objetos originais para que possam ser alterados na View
            var currentProcessor = roundrobin.availableProcessors.shift();
            var quantum = roundrobin.quantum;

            //Caso hajam processadores disponiveis
            if (currentProcessor) {
                var core = config.cores[currentProcessor.id];

                //
                memorySwapping.swap(memoryService);
                if(memorySwapping.hasSwapped(processo)){
                    // debugger;
                    if(!memorySwapping.swapBack(memoryService,processo)){
                        debugger;
                        return;
                    };
                }
                // Adiciona na memoria
                memoryService.adicionarNaMemoria(processo);

                core.state = 'Executando';
                core.processo = processo;
                core.tempo = quantum;
                core.interval = false;

                if (core.interval == false) {
                    core.interval = $interval(function () {

                        if(processo.state == 'Abortado'){
                            $interval.cancel(core.interval);
                            roundrobin.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                            core.state = 'Parado';
                            core.processo = undefined;
                            core.interval = false;
                            core.tempo = 0;
                            processo.progress = 100;
                            processo.progressStyle = 'danger';

                        }else {
                            if (core.tempo > 0 && processo.tempoExecutado < processo.tempoTotal) {
                                var coreTempo = core.tempo - 1;
                                if (coreTempo < 0) {
                                    core.tempo = 0;
                                } else {
                                    core.tempo--;
                                }

                                if(processo.chance()){
                                    memoryService.aumentarMemoria(processo,memorySwapping);
                                    if(processo.state == 'Abortado'){
                                        return;
                                    }
                                }

                                processo.state = 'Executando';
                                processo.progressStyle = 'default';
                                processo.tempoExecutado += 1;
                                processo.progress = Math.floor((processo.tempoExecutado / processo.tempoTotal) * 100);
                            } else if (core.tempo == 0 && processo.tempoExecutado < processo.tempoTotal) {
                                $interval.cancel(core.interval);
                                roundrobin.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                                processo.state = 'Aguardando';
                                processo.progressStyle = 'warning';
                                roundrobin.filaDePrioridade[processo.prioridade].push(core.processo);
                                core.state = 'Parado';
                                core.processo = undefined;
                                core.interval = false;
                                core.tempo = 0;
                            } else if (processo.tempoExecutado == processo.tempoTotal) {
                                $interval.cancel(core.interval);
                                roundrobin.availableProcessors.splice(currentProcessor.id, 0, currentProcessor);
                                core.state = 'Parado';
                                core.processo = undefined;
                                core.interval = false;
                                core.tempo = 0;
                                processo.progress = 100;
                                processo.state = 'Concluido';
                                processo.progressStyle = 'success';
                                memoryService.encerrarProcesso(processo);
                            }
                        }

                    }, 1000);
                }
            }
            else {
                roundrobin.filaDePrioridade[processo.prioridade].push(processo);
            }
        }
    };



    var buscarProximoProcesso = function () {
        var processo;
        if(roundrobin.filaDePrioridade[0].length == 0
            && roundrobin.filaDePrioridade[1].length == 0
            && roundrobin.filaDePrioridade[2].length == 0
            && roundrobin.filaDePrioridade[3].length == 0){
            return undefined;
        }else if(roundrobin.ultimaFilaProcessada < 4){
            processo = roundrobin.filaDePrioridade[roundrobin.ultimaFilaProcessada].shift();
            roundrobin.ultimaFilaProcessada += 1 ;
        }else if(roundrobin.ultimaFilaProcessada == 4){
            roundrobin.ultimaFilaProcessada = 0;
            return buscarProximoProcesso();
        }
        return processo;
    };

    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return roundrobin;
});