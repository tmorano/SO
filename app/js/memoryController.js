sistemasOperacionais.controller('memoryController', function ($rootScope, $scope,$timeout) {

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    $scope.config.arrayOfProcessMemory = {
        options: {
            chart: {
                type: 'bar',
            },
            plotOptions: {
                series: {
                    stacking: 'normal'
                }
            }
        },
        series: [],
        title: {
            text: 'Processos'
        },
        xAxis: {
            categories: ['Memory Blocks', 'VirtualMemoryBlocks']
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Arrays de memoria (tamanho)'
            }
        },
        legend : {
          reversed : true
        },
        size: {}
    }

    $scope.totalMemoryChart = {
        options: {
            chart: {
                type: 'spline',
                marginRight: 10,
            },
        },
        series: [{
            name: 'Memoria Disponivel',
            data: (function () {
                var data = [],
                    time = (new Date()).getTime();

                data.push({
                    x: time,
                    y: $scope.config.memory.size
                });
                return data;
            }())
        }],
        title: {
            text: 'Memoria Disponivel'
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150
        },
        yAxis: {
            title: {
                text: 'Memoria Total(kb)'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        loading: false,
        size: {}
    }

    function addPoint (){
        // set up the updating of the chart each second
        var x = (new Date()).getTime(), // current time
            y = $scope.config.memory.size
        var time = {
            x : x,
            y : y
        }
        $scope.totalMemoryChart.series[0].data.push(time);
        if($scope.totalMemoryChart.series[0].data.length > 60){
            $scope.totalMemoryChart.series[0].data.shift();
        }
        $timeout(addPoint, 1000);
    }

    addPoint();
});
