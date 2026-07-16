from manim import *
import math

class CraftLauncherPromo(Scene):
    def construct(self):
        # 深色科技感背景
        self.camera.background_color = "#0d1117"
        
        # ============ 开场：Logo动画 ============
        # 创建Minecraft风格方块
        def create_pixel_cube():
            cube = VGroup()
            colors = ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"]
            for i in range(4):
                for j in range(4):
                    pixel = Square(side_length=0.4, fill_color=colors[(i+j)%4], fill_opacity=1, stroke_width=0)
                    pixel.shift(RIGHT * j * 0.4 + DOWN * i * 0.4)
                    cube.add(pixel)
            cube.shift(LEFT * 0.6 + UP * 0.6)
            return cube
        
        logo_cube = create_pixel_cube()
        logo_cube.scale(1.5)
        logo_cube.shift(UP * 2 + LEFT * 3)
        
        # Logo标题
        logo_title = Text("Craft", font="Microsoft YaHei", weight=BOLD).scale(1.8)
        logo_title.set_color("#4CAF50")
        logo_launcher = Text("Launcher", font="Microsoft YaHei", weight=BOLD).scale(1.8)
        logo_launcher.set_color("#81C784")
        logo_group = VGroup(logo_title, logo_launcher).arrange(RIGHT, buff=0.1)
        logo_group.next_to(logo_cube, RIGHT, buff=0.5)
        
        # 开场动画
        self.play(DrawBorderThenFill(logo_cube), run_time=1)
        self.play(Write(logo_title), Write(logo_launcher), run_time=1)
        
        # 闪光效果
        flash = Rectangle(width=14, height=8, fill_color=WHITE, fill_opacity=0.3, stroke_width=0)
        self.play(FadeIn(flash), run_time=0.1)
        self.play(FadeOut(flash), run_time=0.3)
        
        self.wait(0.5)
        
        # ============ 功能展示 ============
        # 淡出logo，移到上方
        self.play(
            logo_cube.animate.scale(0.6).to_edge(UP, buff=0.5).shift(LEFT * 3),
            logo_group.animate.scale(0.6).next_to(logo_cube, RIGHT, buff=0.3),
            run_time=0.8
        )
        
        # 功能卡片
        features = [
            ("多版本支持", "支持 Minecraft 全版本", "#2196F3"),
            ("一键安装模组", "海量模组资源", "#4CAF50"),
            ("自动安装Java", "智能环境配置", "#FF9800"),
            ("微软账号登录", "安全正版验证", "#E91E63"),
        ]
        
        cards = VGroup()
        for i, (title, desc, color) in enumerate(features):
            # 卡片背景
            card_bg = RoundedRectangle(width=3.2, height=2, corner_radius=0.2, 
                                       fill_color="#1a1a2e", fill_opacity=0.9, 
                                       stroke_color=color, stroke_width=2)
            # 图标圆点
            icon = Circle(radius=0.25, fill_color=color, fill_opacity=1, stroke_width=0)
            icon.shift(UP * 0.5)
            # 标题文字
            title_text = Text(title, font="Microsoft YaHei", weight=BOLD).scale(0.5)
            title_text.set_color(WHITE)
            title_text.next_to(icon, DOWN, buff=0.15)
            # 描述文字  
            desc_text = Text(desc, font="Microsoft YaHei").scale(0.35)
            desc_text.set_color("#888888")
            desc_text.next_to(title_text, DOWN, buff=0.1)
            
            card = VGroup(card_bg, icon, title_text, desc_text)
            cards.add(card)
        
        cards.arrange(RIGHT, buff=0.6)
        cards.move_to(ORIGIN).shift(DOWN * 0.5)
        
        # 卡片入场动画（逐个飞入）
        for i, card in enumerate(cards):
            card.shift(DOWN * 4)
            self.play(card.animate.shift(UP * 4), run_time=0.4, rate_func=smooth)
        
        self.wait(1)
        
        # ============ 下载速度展示 ============
        self.play(FadeOut(cards), run_time=0.5)
        
        speed_title = Text("极速下载", font="Microsoft YaHei", weight=BOLD).scale(1.2)
        speed_title.set_color("#4CAF50")
        speed_title.to_edge(UP, buff=1)
        
        # 速度指示器
        speed_values = ["0 MB/s", "5 MB/s", "15 MB/s", "25 MB/s", "50 MB/s"]
        speed_colors = ["#f44336", "#ff9800", "#ffeb3b", "#8bc34a", "#4caf50"]
        
        speed_bar = Rectangle(width=10, height=0.8, fill_color="#1a1a2e", fill_opacity=1, stroke_color="#333333", stroke_width=1)
        speed_bar.shift(DOWN * 0.5)
        
        speed_fill = Rectangle(width=0, height=0.8, fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        speed_fill.align_to(speed_bar, LEFT)
        
        speed_num = Text("0 MB/s", font="Microsoft YaHei", weight=BOLD).scale(0.8)
        speed_num.set_color("#4CAF50")
        speed_num.next_to(speed_bar, DOWN, buff=0.3)
        
        self.play(Write(speed_title), FadeIn(speed_bar), FadeIn(speed_num), run_time=0.5)
        
        # 速度增长动画
        for i in range(1, 6):
            progress = i / 5
            new_width = 10 * progress
            color = speed_colors[i-1]
            
            self.play(
                speed_fill.animate.set_width(new_width).set_color(color),
                speed_num.animate.set_text(speed_values[i-1]).set_color(color),
                run_time=0.3
            )
        
        self.wait(0.5)
        
        # ============ 启动演示 ============
        self.play(FadeOut(speed_title), FadeOut(speed_bar), FadeOut(speed_fill), FadeOut(speed_num), run_time=0.3)
        
        launch_title = Text("一键启动游戏", font="Microsoft YaHei", weight=BOLD).scale(1.2)
        launch_title.set_color("#4CAF50")
        launch_title.to_edge(UP, buff=1)
        
        # 启动按钮
        button_bg = RoundedRectangle(width=5, height=1.2, corner_radius=0.6,
                                     fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        button_text = Text("启动游戏", font="Microsoft YaHei", weight=BOLD).scale(0.7)
        button_text.set_color(WHITE)
        button = VGroup(button_bg, button_text)
        
        # 进度环
        progress_ring = Circle(radius=1.5, stroke_color="#333333", stroke_width=8, fill_opacity=0)
        progress_arc = Arc(radius=1.5, start_angle=PI/2, angle=0, stroke_color="#4CAF50", stroke_width=8)
        
        progress_ring.shift(DOWN * 1.5)
        progress_arc.shift(DOWN * 1.5)
        
        self.play(Write(launch_title), run_time=0.3)
        self.play(FadeIn(button), run_time=0.3)
        self.wait(0.3)
        
        # 点击按钮效果
        self.play(button.animate.scale(0.95), run_time=0.1)
        self.play(button.animate.scale(1.05), run_time=0.1)
        self.play(button.animate.scale(1), run_time=0.1)
        
        self.play(FadeOut(button), run_time=0.2)
        self.play(FadeIn(progress_ring), run_time=0.3)
        
        # 进度环填充动画
        launch_steps = ["检查环境", "加载版本", "验证文件", "启动中...", "完成!"]
        for i, step in enumerate(launch_steps):
            angle = -PI/2 - (i + 1) / 5 * 2 * PI
            
            new_arc = Arc(radius=1.5, start_angle=PI/2, angle=-((i+1)/5)*2*PI, 
                          stroke_color="#4CAF50", stroke_width=8)
            new_arc.shift(DOWN * 1.5)
            
            step_text = Text(step, font="Microsoft YaHei").scale(0.5)
            step_text.set_color(WHITE)
            step_text.next_to(progress_ring, DOWN, buff=1)
            
            self.play(
                Transform(progress_arc, new_arc),
                FadeIn(step_text),
                run_time=0.4
            )
            self.wait(0.1)
            self.play(FadeOut(step_text), run_time=0.1)
        
        # ============ 结尾 ============
        self.play(
            FadeOut(progress_ring), FadeOut(progress_arc), FadeOut(launch_title),
            run_time=0.3
        )
        
        # 最终Logo展示
        final_logo_cube = create_pixel_cube().scale(2)
        final_title = Text("Craft Launcher", font="Microsoft YaHei", weight=BOLD).scale(2)
        final_title.set_color("#4CAF50")
        final_title.next_to(final_logo_cube, RIGHT, buff=0.5)
        
        final_group = VGroup(final_logo_cube, final_title)
        
        # 版本信息
        version_text = Text("v1.0.0", font="Microsoft YaHei").scale(0.6)
        version_text.set_color("#888888")
        version_text.next_to(final_group, DOWN, buff=0.5)
        
        # 下载按钮
        download_btn = RoundedRectangle(width=4, height=0.8, corner_radius=0.4,
                                       fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        download_text = Text("立即下载", font="Microsoft YaHei", weight=BOLD).scale(0.5)
        download_text.set_color(WHITE)
        download_btn_group = VGroup(download_btn, download_text)
        download_btn_group.next_to(version_text, DOWN, buff=0.6)
        
        self.play(DrawBorderThenFill(final_logo_cube), Write(final_title), run_time=1)
        self.play(FadeIn(version_text), FadeIn(download_btn_group), run_time=0.5)
        
        # 按钮呼吸效果
        self.play(download_btn_group.animate.scale(1.1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1.1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1), run_time=0.3)
        
        self.wait(1)


if __name__ == "__main__":
    scene = CraftLauncherPromo()
    scene.render()