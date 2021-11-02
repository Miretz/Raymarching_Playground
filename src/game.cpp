#include "game.hpp"

#include <chrono>
#include <memory>
#include <vector>

#include "SFML/Graphics/Shader.hpp"

void Game::initialize()
{
    initializeShader();
    initializeWindow();
    initializeTexture();
    initializeMenus();
}

void Game::run()
{
    clock_.restart();

    isRunning_ = true;

    while (isRunning_)
    {
        auto time1(std::chrono::high_resolution_clock::now());

        window_.clear(sf::Color::Black);
        renderTexture_.clear();

        checkInput();
        update();
        draw();

        auto time2(std::chrono::high_resolution_clock::now());
        auto elapsedTime(time2 - time1);
        auto frameTime = std::chrono::duration_cast<std::chrono::duration<float, std::milli>>(elapsedTime).count();

        lastTime_ = frameTime;

        const auto ftSeconds = lastTime_ / 1000.f;
        if (ftSeconds > 0.f)
        {
            window_.setTitle("FT: " + std::to_string(frameTime) + "\tFPS: " + std::to_string(1.f / ftSeconds));
        }
    }
}

void Game::checkInput()
{
    sf::Event event{};
    while (window_.pollEvent(event))
    {
        const auto &mousePos = static_cast<sf::Vector2f>(sf::Mouse::getPosition(window_));

        if (gameState_ == GameState::IN_GAME)
        {
            if (event.type == sf::Event::Closed)
            {
                isRunning_ = false;
            }
            else if ((event.type == sf::Event::KeyPressed) && (event.key.code == sf::Keyboard::Escape))  // NOLINT
            {
                currentMenuId_ = kMainMenuId;
                gameState_ = GameState::IN_MENU;
            }
        }
        else
        {
            menus_.at(currentMenuId_).handleInput(event, mousePos);
        }
    }
}

void Game::update()
{
    if (gameState_ != GameState::IN_GAME)
    {
        return;
    }

    currentSlice_ += lastTime_;

    for (; currentSlice_ >= kTimeSlice; currentSlice_ -= kTimeSlice)
    {
        // sleep
    }
}

void Game::draw()
{
    if (gameState_ != GameState::IN_GAME)
    {
        menus_.at(currentMenuId_).draw(window_);
        return;
    }

    shader_.setUniform("iTime", clock_.getElapsedTime().asSeconds());
    renderTexture_.draw(spriteWorld_, states_);
    renderTexture_.display();
    window_.draw(spriteWorld_);
    window_.display();
}

void Game::initializeWindow()
{
    if (window_.isOpen())
    {
        window_.close();
    }

    if (isFullscreen_)
    {
        window_.create(sf::VideoMode::getDesktopMode(), kGameTitle, sf::Style::Fullscreen);
    }
    else
    {
        window_.create(sf::VideoMode(kDefaultWindowWidth, kDefaultWindowHeight), kGameTitle, sf::Style::Close);
    }
    shaderResolution_ = sf::Vector2f(kDefaultWindowWidth, kDefaultWindowHeight);
    shader_.setUniform("iResolution", shaderResolution_);
    window_.setFramerateLimit(kFramerateLimit);
    window_.setVerticalSyncEnabled(true);
}

void Game::initializeShader()
{
    shader_.loadFromFile(kShaderFile, sf::Shader::Fragment);
    states_.shader = &shader_;
    states_.blendMode = sf::BlendAdd;
}

void Game::initializeTexture()
{
    renderTexture_.create(static_cast<unsigned int>(shaderResolution_.x), static_cast<unsigned int>(shaderResolution_.y));
    renderTexture_.setSmooth(true);
    spriteWorld_.setTexture(renderTexture_.getTexture());
    spriteWorld_.setOrigin(0.f, 0.f);
    spriteWorld_.setPosition(0.f, 0.f);
    spriteWorld_.setScale(
        static_cast<float>(window_.getSize().x) / spriteWorld_.getLocalBounds().width,
        static_cast<float>(window_.getSize().y) / spriteWorld_.getLocalBounds().height);
}

void Game::initializeMenus()
{
    menus_.resize(3);
    menus_[kMainMenuId].initialize(
        kMenuX,
        kMenuY,
        "Raymarching Playground",
        {
            { "Run", [this]() { gameState_ = GameState::IN_GAME; } },
            { "Options", [this]() { currentMenuId_ = kOptionsMenuId; } },
            { "Exit", [this]() { currentMenuId_ = kExitMenuId; } },
        },
        [this]() { currentMenuId_ = kExitMenuId; });

    menus_[kOptionsMenuId].initialize(
        kMenuX,
        kMenuY,
        "Options",
        {
            { "Toggle Fullscreen",
              [this]()
              {
                  isFullscreen_ = !isFullscreen_;
                  initializeWindow();
                  initializeTexture();
              } },
            { "Back", [this]() { currentMenuId_ = kMainMenuId; } },
        },
        [this]() { currentMenuId_ = kMainMenuId; });

    menus_[kExitMenuId].initialize(
        kMenuX,
        kMenuY,
        "Are you sure?",
        {
            { "Yes", [this]() { isRunning_ = false; } },
            { "No", [this]() { currentMenuId_ = kMainMenuId; } },
        },
        [this]() { currentMenuId_ = kMainMenuId; });
}
