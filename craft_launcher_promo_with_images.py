from manim import *
import os

class CraftLauncherPromoImages(Scene):
    def construct(self):
        bg_image = ImageMobject("assets/image_0_yi19x4.jpg").scale(1.2)
        bg_image.set_opacity(0.4)
        self.add(bg_image)
        
        overlay = Rectangle(width=14, height=8, fill_color="#0d1117", fill_opacity=0.7, stroke_width=0)
        self.add(overlay)
        
        # ============ 开场：Logo动画 ============
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
        logo_cube.scale(1.8)
        logo_cube.shift(UP * 2)
        
        logo_title = Text("Craft", font="Microsoft YaHei", weight=BOLD).scale(2)
        logo_title.set_color("#4CAF50")
        logo_launcher = Text("Launcher", font="Microsoft YaHei", weight=BOLD).scale(2)
        logo_launcher.set_color("#81C784")
        logo_group = VGroup(logo_title, logo_launcher).arrange(RIGHT, buff=0.1)
        logo_group.next_to(logo_cube, RIGHT, buff=0.6)
        
        self.play(DrawBorderThenFill(logo_cube), run_time=1)
        self.play(Write(logo_title), Write(logo_launcher), run_time=1)
        
        flash = Rectangle(width=14, height=8, fill_color=WHITE, fill_opacity=0.2, stroke_width=0)
        self.play(FadeIn(flash), run_time=0.1)
        self.play(FadeOut(flash), run_time=0.3)
        
        self.wait(0.5)
        
        # ============ 网站信息展示 ============
        website_text = Text("https://mcl.site.je", font="Microsoft YaHei").scale(0.5)
        website_text.set_color("#4CAF50")
        website_text.next_to(logo_group, DOWN, buff=0.8)
        
        self.play(FadeIn(website_text), run_time=0.5)
        self.wait(0.5)
        
        self.play(
            logo_cube.animate.scale(0.5).to_edge(UP, buff=0.5).shift(LEFT * 3),
            logo_group.animate.scale(0.5).next_to(logo_cube, RIGHT, buff=0.3),
            website_text.animate.scale(0.6).next_to(logo_group, DOWN, buff=0.2),
            run_time=0.8
        )
        
        # ============ 功能特性展示 ============
        features = [
            ("多版本管理", "支持原版、Forge、Fabric", "#2196F3"),
            ("极速下载", "官方源、BMCLAPI、MCBBS", "#4CAF50"),
            ("模组中心", "集成 Modrinth 模组库", "#FF9800"),
            ("智能配置", "自动检测 Java 版本", "#E91E63"),
        ]
        
        cards = VGroup()
        for i, (title, desc, color) in enumerate(features):
            card_bg = RoundedRectangle(width=3, height=2, corner_radius=0.2, 
                                       fill_color="#1a1a2e", fill_opacity=0.85, 
                                       stroke_color=color, stroke_width=2)
            
            icon = Circle(radius=0.25, fill_color=color, fill_opacity=1, stroke_width=0)
            icon.shift(UP * 0.5)
            
            title_text = Text(title, font="Microsoft YaHei", weight=BOLD).scale(0.5)
            title_text.set_color(WHITE)
            title_text.next_to(icon, DOWN, buff=0.1)
            
            desc_text = Text(desc, font="Microsoft YaHei").scale(0.32)
            desc_text.set_color("#888888")
            desc_text.next_to(title_text, DOWN, buff=0.1)
            
            card = VGroup(card_bg, icon, title_text, desc_text)
            cards.add(card)
        
        cards.arrange(RIGHT, buff=0.5)
        cards.move_to(ORIGIN).shift(DOWN * 0.5)
        
        for i, card in enumerate(cards):
            card.shift(DOWN * 4)
            self.play(card.animate.shift(UP * 4), run_time=0.4, rate_func=smooth)
        
        self.wait(1.5)
        
        # ============ 数据统计 ============
        self.play(FadeOut(cards), run_time=0.5)
        
        stats_data = [
            ("100+", "支持版本"),
            ("99.9%", "下载成功率"),
            ("0", "广告弹窗"),
            ("极速", "下载速度"),
        ]
        
        stats_group = VGroup()
        for i, (value, label) in enumerate(stats_data):
            value_text = Text(value, font="Microsoft YaHei", weight=BOLD).scale(1.5)
            value_text.set_color("#4CAF50")
            label_text = Text(label, font="Microsoft YaHei").scale(0.5)
            label_text.set_color("#888888")
            
            stat = VGroup(value_text, label_text).arrange(DOWN, buff=0.2)
            stats_group.add(stat)
        
        stats_group.arrange(RIGHT, buff=2)
        stats_group.move_to(ORIGIN)
        
        for stat in stats_group:
            stat.shift(LEFT * 8)
            self.play(stat.animate.shift(RIGHT * 8), run_time=0.4)
        
        self.wait(1.5)
        
        # ============ 启动演示 ============
        self.play(FadeOut(stats_group), run_time=0.5)
        
        launch_title = Text("一键启动游戏", font="Microsoft YaHei", weight=BOLD).scale(1.2)
        launch_title.set_color("#4CAF50")
        launch_title.to_edge(UP, buff=1)
        
        button_bg = RoundedRectangle(width=5, height=1.2, corner_radius=0.6,
                                     fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        button_text = Text("启动游戏", font="Microsoft YaHei", weight=BOLD).scale(0.7)
        button_text.set_color(WHITE)
        button = VGroup(button_bg, button_text)
        
        progress_ring = Circle(radius=1.5, stroke_color="#333333", stroke_width=8, fill_opacity=0)
        progress_arc = Arc(radius=1.5, start_angle=PI/2, angle=0, stroke_color="#4CAF50", stroke_width=8)
        
        progress_ring.shift(DOWN * 1)
        progress_arc.shift(DOWN * 1)
        
        self.play(Write(launch_title), run_time=0.3)
        self.play(FadeIn(button), run_time=0.3)
        self.wait(0.3)
        
        self.play(button.animate.scale(0.95), run_time=0.1)
        self.play(button.animate.scale(1.05), run_time=0.1)
        self.play(button.animate.scale(1), run_time=0.1)
        
        self.play(FadeOut(button), run_time=0.2)
        self.play(FadeIn(progress_ring), run_time=0.3)
        
        launch_steps = ["检查环境", "加载版本", "验证文件", "启动中...", "完成!"]
        for i, step in enumerate(launch_steps):
            new_arc = Arc(radius=1.5, start_angle=PI/2, angle=-((i+1)/5)*2*PI, 
                          stroke_color="#4CAF50", stroke_width=8)
            new_arc.shift(DOWN * 1)
            
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
        
        final_logo_cube = create_pixel_cube().scale(2.5)
        final_title = Text("Craft Launcher", font="Microsoft YaHei", weight=BOLD).scale(2)
        final_title.set_color("#4CAF50")
        final_title.next_to(final_logo_cube, RIGHT, buff=0.5)
        
        final_group = VGroup(final_logo_cube, final_title)
        
        version_text = Text("v1.0.0", font="Microsoft YaHei").scale(0.6)
        version_text.set_color("#888888")
        version_text.next_to(final_group, DOWN, buff=0.4)
        
        website_final = Text("mcl.site.je", font="Microsoft YaHei").scale(0.5)
        website_final.set_color("#4CAF50")
        website_final.next_to(version_text, DOWN, buff=0.3)
        
        download_btn = RoundedRectangle(width=4, height=0.8, corner_radius=0.4,
                                       fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        download_text = Text("立即下载", font="Microsoft YaHei", weight=BOLD).scale(0.5)
        download_text.set_color(WHITE)
        download_btn_group = VGroup(download_btn, download_text)
        download_btn_group.next_to(website_final, DOWN, buff=0.6)
        
        self.play(DrawBorderThenFill(final_logo_cube), Write(final_title), run_time=1)
        self.play(FadeIn(version_text), FadeIn(website_final), run_time=0.5)
        self.play(FadeIn(download_btn_group), run_time=0.5)
        
        self.play(download_btn_group.animate.scale(1.1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1.1), run_time=0.3)
        self.play(download_btn_group.animate.scale(1), run_time=0.3)
        
        self.wait(1)


if __name__ == "__main__":
    scene = CraftLauncherPromoImages()
    scene.render()