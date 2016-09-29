sistemasOperacionais.controller('processController', function ($rootScope, $scope, $interval, AlgorithmFactoryService) {
    var service;

    $scope.processos = [];
    $scope.filaDePrioridade = [[], [], [], []]
    $scope.config;


    $scope.$on('iniciar', function (events, args) {
        $scope.config = args;

        //Associa objeto da fabrica para algoritmo especifico
        service = AlgorithmFactoryService.buildAlgorithm($scope.config.algoritmo);
        service.configurar(args);
        createProcess(service, args.processos);
        $scope.filaDePrioridade = service.filaDePrioridade;

        service.executar();
    });

    $scope.$on('parar', function (events, args) {
        $scope.getProcessos().length = 0;
    });

    var createProcess = function (service, processos) {
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
        service.createProcess($scope.getProcessos());
    };
});