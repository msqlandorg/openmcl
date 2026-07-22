import { Clock, CheckCircle, AlertCircle, Bug } from 'lucide-react';

const changelog = [
  {
    version: 'v2.4.1',
    date: '2026-07-10',
    changes: [
      { type: 'feature', text: '新增下载引擎优化，提升下载速度 30%' },
      { type: 'bugfix', text: '修复部分模组加载失败的问题' },
      { type: 'improvement', text: '优化启动器界面响应速度' },
    ],
  },
  {
    version: 'v2.4.0',
    date: '2026-06-15',
    changes: [
      { type: 'feature', text: '全新界面设计，更现代化的视觉体验' },
      { type: 'feature', text: '新增模组市场功能，浏览和下载模组' },
      { type: 'improvement', text: '支持自定义主题颜色' },
      { type: 'bugfix', text: '修复版本切换时的崩溃问题' },
    ],
  },
  {
    version: 'v2.3.5',
    date: '2026-05-20',
    changes: [
      { type: 'feature', text: '新增自动更新功能' },
      { type: 'improvement', text: '优化内存使用，减少卡顿' },
      { type: 'bugfix', text: '修复登录失败的问题' },
    ],
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return CheckCircle;
    case 'bugfix':
      return Bug;
    case 'improvement':
    default:
      return AlertCircle;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'text-green-400';
    case 'bugfix':
      return 'text-red-400';
    case 'improvement':
    default:
      return 'text-yellow-400';
  }
};

export function Changelog() {
  return (
    <section id="changelog" className="py-24 bg-[#1a1a2e]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#4b3fe3]/20 text-[#4b3fe3] text-sm font-medium mb-4">
            更新日志
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            版本更新
          </h2>
          <p className="text-lg text-gray-400">
            我们持续改进 Craft Launcher，为你提供更好的体验
          </p>
        </div>

        <div className="space-y-8">
          {changelog.map((entry) => (
            <div
              key={entry.version}
              className="relative pl-8 border-l-2 border-[#4b3fe3]/30 hover:border-[#4b3fe3] transition-colors"
            >
              <div className="absolute left-[-6px] top-0 w-3 h-3 rounded-full bg-[#4b3fe3]"></div>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xl font-bold text-white">{entry.version}</span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  {entry.date}
                </div>
              </div>
              
              <ul className="space-y-3">
                {entry.changes.map((change, index) => {
                  const Icon = getIcon(change.type);
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${getColor(change.type)} flex-shrink-0`} />
                      <span className="text-gray-300">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}