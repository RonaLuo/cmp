import CanvasService from '@/services/CanvasService.js';
import OpenStackService from '@/services/OpenStackService.js';
import Xclarity from '@/components/xclarity/xclarity.vue';

const loadMsg = '加载中...';
const loadErrorMsg = '服务端异常';
export default {
  name: 'dashboard',
  data() {
    return {
      data: {
        hypervisorCount: loadMsg,
        runningVmCount: loadMsg,
        local: loadMsg,
        virtualCpu: loadMsg,
        memory: loadMsg,
        networkCount: loadMsg
      },
      dataStatus: true,
      historyData: true,
      isXClarity:false,
    }
  },
  methods: {
    openstackShow() {
      this.$Modal.alert('OpenStack 暂未开放！');
    },
    kubernetesShow() {
      this.$Modal.alert('Kubernetes 暂未开放！');
    },
    //拆分时间
    getChartXLineData(data) {
      let dateArray = [];
      let startDate = '';
      let endDate = '';
      let title = '';
      for (let i = 0; i < data.length; i++) {
        dateArray.push(data[i].createTm.split(" ")[0]);
        if (i == 0) {
          startDate = data[i].createTm.split(" ")[0];
        } else if (i == data.length - 1) {
          endDate = data[i].createTm.split(" ")[0];
        }
      }
      if (startDate == endDate) {
        title = startDate + "数据";
      } else {
        title = startDate + "至" + endDate + "数据";
      }
      return {xData: dateArray, title: title};
    },
    //获得cpu信息
    getCpuChartYLineData(data) {
      return [{
        name: '可用cpu总数',
        value: data.virtualCpu - data.virtualUsedCpu,
      }, {
        name: '已用cpu总数',
        value: data.virtualUsedCpu,
      }
      ]
    },
    //获得内存信息
    getMemoryChartYLineData(data) {
      return [{
        name: '可用内存大小',
        value: data.memory - data.memoryUsed,
      }, {
        name: '已用内存大小',
        value: data.memoryUsed,
      }
      ]
    },
    //获得存储信息
    getStoreChartYLineData(data) {
      return [{
        name: '空闲磁盘大小',
        value: data.freeDisk,
      }, {
        name: '已用磁盘大小',
        value: data.localUsed,
      }]
    },
    //获得网络信息
    getNetChartYLineData(data) {
      let netCountArray = [];
      for (let i = 0; i < data.length; i++) {
        netCountArray.push(data[i].networkCount);
      }
      return {
        netCountArray: netCountArray
      }
    },
    server() {
    },
  },
  mounted() {
    OpenStackService.openStackInfo().then((res) => {
      if (res.data.success) {
        this.data = res.data.result;
        CanvasService.drawCPUDepletionGraph(this.$refs.cpu, this.getCpuChartYLineData(this.data));
        CanvasService.drawMemoryDepletionGraph(this.$refs.ram, this.getMemoryChartYLineData(this.data));
        CanvasService.drawStoreDepletionGraph(this.$refs.store, this.getStoreChartYLineData(this.data));
      } else {
        this.dataStatus = false;
        this.data = {
          hypervisorCount: loadErrorMsg,
          runningVmCount: loadErrorMsg,
          local: loadErrorMsg,
          virtualCpu: loadErrorMsg,
          memory: loadErrorMsg,
          networkCount: loadErrorMsg
        }
      }
    });
    OpenStackService.openStackInfoHistory().then((res) => {
      if (res.data.success) {
        const tmpData = res.data.result.list;
        const xLineData = this.getChartXLineData(tmpData);

        const yNetWorkData = this.getNetChartYLineData(tmpData);
        const netData = {...xLineData, yData: yNetWorkData};
        CanvasService.drawNetWorkDepletionGraph(this.$refs.network, netData);
      } else {
        this.historyData = false;
      }
    });
  },
  components: {Xclarity},
};
