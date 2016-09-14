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
        var quantum =  $scope.quantum;
        while ($scope.processArray.length > 0){
            $scope.coresArray.forEach(function (eachCore) {
                if(eachCore.state == 'Ocioso'){
                    var eachProcess = $scope.processArray[0];
                    eachProcess.runningTime = 6;
                }
            })
        }
    }

    function startProcess(eachProcess, quantum){
        var stop;
        if ( angular.isDefined(stop) ) return;
        stop = $interval(function () {
            if(eachProcess.timeLeft > 0 && quantum > 0){

            }
        })

    }

}
app.controller("RobinRoundController", ["$scope", RoundRobinController]);
