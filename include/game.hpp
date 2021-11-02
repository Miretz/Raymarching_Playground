#pragma once

#include <SFML/Graphics.hpp>
#include <vector>

#include "menu.hpp"

inline constexpr auto kShaderFile = "assets/shaders/shader.frag";
inline constexpr float kMenuX = 20.f;
inline constexpr float kMenuY = 20.f;
inline constexpr unsigned int kDefaultWindowWidth = 848;
inline constexpr unsigned int kDefaultWindowHeight = 480;
inline constexpr auto kGameTitle = "Raymarching Playground";
inline constexpr int kFramerateLimit = 60;

inline constexpr size_t kMainMenuId = 0;
inline constexpr size_t kOptionsMenuId = 1;
inline constexpr size_t kExitMenuId = 2;

enum class GameState
{
    IN_GAME,
    IN_MENU,
};

class Game
{
public:
    void initialize();
    void run();

private:
    std::vector<Menu> menus_;
    size_t currentMenuId_ = kMainMenuId;

    sf::Clock clock_;

    sf::Shader shader_;
    const sf::Vector2f shaderResolution_ = sf::Vector2f(kDefaultWindowWidth, kDefaultWindowHeight);

    bool isRunning_ = false;
    bool isFullscreen_ = false;

    GameState gameState_ = GameState::IN_MENU;

    sf::RenderWindow window_;
    sf::RenderStates states_;
    sf::RenderTexture renderTexture_;
    sf::Sprite spriteWorld_;

private:
    void initializeWindow();
    void initializeMenus();
    void initializeTexture();
    void initializeShader();
    void checkInput();
    void draw();
};