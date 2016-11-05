sistemasOperacionais.controller('processController', function ($rootScope, $scope, $interval, AlgorithmFactoryService, MemoryAlgorithmFactoryService) {
    var service;
    var memoryService;

    $scope.processos = [];
    $scope.filaDePrioridade = [[], [], [], []];
    $scope.config;


    $scope.$on('iniciar', function (events, args) {
        $scope.config = args;

        //Associa objeto da fabrica para algoritmo especifico
        // processos = [{
        //   pid: 0,
        //   processo: "Processo " + 0,
        //   progress: 0,
        //   state: 'Pronto',
        //   prioridade: 0,
        //   tempoExecutado: 0,
        //   tempoTotal: 4,
        //   memory : 64,
        //   chance: false
        // },
        // {
        //   pid: 1,
        //   processo: "Processo " + 1,
        //   progress: 0,
        //   state: 'Pronto',
        //   prioridade: 0,
        //   tempoExecutado: 0,
        //   tempoTotal: 12,
        //   memory : 16,
        //   chance: false
        // },
        // {
        //   pid: 2,
        //   processo: "Processo " + 2,
        //   progress: 0,
        //   state: 'Pronto',
        //   prioridade: 0,
        //   tempoExecutado: 0,
        //   tempoTotal: 8,
        //   memory : 32,
        //   chance: false
        // },
        // {
        //   pid: 3,
        //   processo: "Processo " + 3,
        //   progress: 0,
        //   state: 'Pronto',
        //   prioridade: 0,
        //   tempoExecutado: 0,
        //   tempoTotal: 12,
        //   memory : 64,
        //   chance: false
        // },]
        // $scope.processos = processos;
        //
        // for(var i = 0;i < $scope.processos.length;i++){
        //   $scope.filaDePrioridade[0].push($scope.processos[i])
        // }

        service = AlgorithmFactoryService.buildAlgorithm($scope.config.algoritmo);
        memoryService = MemoryAlgorithmFactoryService.buildAlgorithm($scope.config.memoryAlgoritmo);
        service.configurar(args);
        // service.filaDePrioridade = $scope.filaDePrioridade;
        memoryService.iniciarMemoria(args);

        createProcess(service, memoryService, args.processos);
        $scope.filaDePrioridade = service.filaDePrioridade;

        service.executar(memoryService);
    });

    $scope.$on('parar', function (events, args) {
        $scope.getProcessos().length = 0;
    });

    var createProcess = function (service, memoryService, processos) {
        $scope.getProcessos().length = 0;
        $scope.filaDePrioridade.length = 0;

        for (var i = 0; i < processos; i++) {
            $scope.addProccess();
        }
    }

    $scope.getProcessos = function () {
        return $scope.processos;
    }

    $scope.addProccess = function () {
        //Adicionando o processo dependendo do Algoritmo
        service.createProcess($scope.getProcessos(), memoryService);
    };
});
