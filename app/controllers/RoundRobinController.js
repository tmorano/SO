var RoundRobinController = function($scope, $interval) {
    $scope.quantum = 2;

    $scope.iniciar = function () {
        if ($scope.cores < 1 || $scope.cores > 64) {
            return toastr["error"]("Numero de processadores fora da faixa aceitavel");
        }
        $scope.isProgramStarted = true;
        if($scope.algorithmSelected == 'Round Robin'){
            startRoundRobin();
        }
    };

    function startRoundRobin(){
        var stop;
        var quantum =  $scope.quantum;
        while ($scope.processArray.length > 0){
            $scope.coresArray.forEach(function (eachCore) {
                if(eachCore.state == 'Ocioso'){
                    $scope.processArray.forEach(function (eachProcess) {
                        if(eachProcess.processState == 'Pronto'){
                            eachCore.state = 'Executando';
                            startProcess(stop,$scope.processArray[eachProcess], quantum);

                        }
                    })
                }
            })
        }
    }

    function startProcess(stop,eachProcess, quantum){
        eachProcess.processState = 'Executando';
        if ( angular.isDefined(stop) ) return;
        stop = $interval(function () {
            if(eachProcess.executionTime < quantum){
            eachProcess.timeLeft -1;
            }
        })

    }

}
app.controller("RobinRoundController", ["$scope", RoundRobinController]);
