sistemasOperacionais.controller('indexController', function ($rootScope, $scope) {
    $scope.config = {
        coresNumber: 1,
        algoritmo: "1",
        quantum: 1,
        processos: 1,
        processadores: [],
        running: false
    };

    $scope.createCores = function () {
        $scope.config.cores = [];
        var i;
        for (i = 0; i < $scope.config.coresNumber; i++) {
            $scope.config.cores.push({
                id: i,
                state: 'Parado',
                tempo: $scope.config.quantum,
                process: {}
            });
        }
        $scope.config.running = true;
        $rootScope.$broadcast('iniciar', $scope.config);
    }

    $scope.parar = function () {
        $scope.config.processadores = [];
        $scope.config.running = false;
        $rootScope.$broadcast('parar');
    }
});