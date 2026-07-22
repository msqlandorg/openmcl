import { Rocket, Puzzle, Layers, RefreshCw, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Rocket,
    title: '快速启动',
    description: '一键启动游戏，无需复杂配置，让你更快进入游戏世界',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Puzzle,
    title: '模组管理',
    description: '智能模组下载与管理，自动解决依赖冲突，轻松安装心仪模组',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Layers,
    title: '版本切换',
    description: '支持多版本快速切换，体验不同版本的 Minecraft',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: RefreshCw,
    title: '自动更新',
    description: '自动检测并更新游戏版本，始终保持最新体验',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Shield,
    title: '安全可靠',
    description: '多重安全验证，保护你的账号和游戏数据安全',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: Zap,
    title: '极致性能',
    description: '优化的启动流程，减少加载时间，提升游戏性能',
    color: 'from-yellow-500 to-yellow-600',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#4b3fe3]/20 text-[#4b3fe3] text-sm font-medium mb-4">
            核心特性
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            为什么选择 Craft Launcher
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            我们致力于为玩家提供最优质的 Minecraft 启动体验
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] hover:from-[#252547] hover:to-[#1e2d4d] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#4b3fe3]/10 border border-white/5 hover:border-[#4b3fe3]/30"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4b3fe3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}