sistemasOperacionais.controller('processController', function ($rootScope, $scope, $interval, AlgorithmFactoryService, MemoryAlgorithmFactoryService) {
    var service;
    var memoryService;

    $scope.processos = [];
    $scope.filaDePrioridade = [[], [], [], []]
    $scope.config;


    $scope.$on('iniciar', function (events, args) {
        $scope.config = args;

        //Associa objeto da fabrica para algoritmo especifico
        service = AlgorithmFactoryService.buildAlgorithm($scope.config.algoritmo);
        memoryService = MemoryAlgorithmFactoryService.buildAlgorithm($scope.config.memoryAlgoritmo);
        service.configurar(args);
        memoryService.iniciarMemoria(args);
        createProcess(service, memoryService, args.processos);
        $scope.filaDePrioridade = service.filaDePrioridade;

        service.executar();
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