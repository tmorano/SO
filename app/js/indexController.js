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
        if(!$scope.config.coresNumber || $scope.config.coresNumber < 1 || $scope.config.coresNumber > 64){
            toastr["error"]("Invalid number of Cores.");
            return
        }else if($scope.config.processos < 1){
            toastr["error"]("Invalid number of Processos.");
            return
        }
        $scope.config.running = true;

        $rootScope.$broadcast('iniciar', $scope.config);
    }

    $scope.parar = function () {
        $scope.config.processadores = [];
        $scope.config.running = false;
        $rootScope.$broadcast('parar');
    }

    $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.series = ['Series A', 'Series B'];
    $scope.data = [
        [65, 59, 80, 81, 56, 55, 40],
        [28, 48, 40, 19, 86, 27, 90]
    ];
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
    $scope.options = {
        scales: {
            yAxes: [
                {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left'
                },
                {
                    id: 'y-axis-2',
                    type: 'linear',
                    display: true,
                    position: 'right'
                }
            ]
        }
    };

});