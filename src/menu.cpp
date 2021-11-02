#include "menu.hpp"
#include "SFML/Config.hpp"

using sf::Uint8;

void Menu::initialize(
    const float x,
    const float y,
    const std::string& title,
    const MenuItems& menuItems,
    const std::function<void()>& exitCallback)
{
    font_.loadFromFile(kFontPath);
    exitCallback_ = exitCallback;

    titleText_.setFont(font_);
    titleText_.setString(title);
    titleText_.setCharacterSize(kTitleHeight);
    titleText_.setPosition(x, y);
    titleText_.setFillColor(sf::Color::White);

    // Menu Items
    auto offset = y + kTitleHeight + kMenuPadding * 2;

    for (const auto& [name, func] : menuItems)
    {
        sf::Text item;
        item.setFont(font_);
        item.setString(name);
        item.setCharacterSize(kCharacterSize);
        item.setPosition(x, offset);
        item.setFillColor(sf::Color::White);

        offset += kMenuItemHeight + kMenuPadding;

        menuItems_.push_back(item);
        callbacks_.push_back(func);
    }
}

void Menu::draw(sf::RenderWindow& window)
{
    window.clear();

    window.draw(titleText_);

    for (size_t i = 0; i < menuItems_.size(); ++i)
    {
        auto& item = menuItems_[i];
        const sf::FloatRect boundingBox = item.getGlobalBounds();
        const sf::FloatRect boundsWithPadding{ boundingBox.left - kMenuPadding / 2.0f,
                                               boundingBox.top - kMenuPadding / 2.0f,
                                               boundingBox.width + kMenuPadding,
                                               boundingBox.height + kMenuPadding };

        // draw selection box
        if (boundsWithPadding.contains(mousePosition_) || selectedIndex_ == i)
        {
            selectedIndex_ = i;

            item.setFillColor(sf::Color::Yellow);

            sf::RectangleShape selector(sf::Vector2f(boundsWithPadding.width, boundsWithPadding.height));
            selector.setPosition(boundsWithPadding.left, boundsWithPadding.top);
            selector.setFillColor(sf::Color(0, 0, 0, 0));
            selector.setOutlineThickness(2);
            static constexpr Uint8 maxColorValue = 255;
            selector.setOutlineColor(sf::Color(maxColorValue, maxColorValue, maxColorValue, maxColorValue));
            window.draw(selector);
        }
        else
        {
            item.setFillColor(sf::Color::White);
        }
        window.draw(item);
    }
    window.display();
}

void Menu::handleInput(const sf::Event& event, const sf::Vector2f& mousePosition)
{
    mousePosition_ = mousePosition;

    const auto keyPressed = event.type == sf::Event::KeyPressed;
    const auto mousePressed = event.type == sf::Event::MouseButtonPressed;
    const auto keyCode = event.key.code; // NOLINT
    const auto mouseButton = event.mouseButton.button; // NOLINT

    if (keyPressed && (keyCode == sf::Keyboard::Escape))
    {
        exitCallback_();
    }
    else if ((keyPressed && (keyCode == sf::Keyboard::Return)) || (mousePressed && (mouseButton == sf::Mouse::Left)))
    {
        callbacks_[selectedIndex_]();
    }
    // enable menu selection using arrow keys
    else if (
        keyPressed && ((keyCode == sf::Keyboard::Down) || (keyCode == sf::Keyboard::S)) &&
        (selectedIndex_ < menuItems_.size() - 1))
    {
        selectedIndex_++;
    }
    else if (keyPressed && ((keyCode == sf::Keyboard::Up) || (keyCode == sf::Keyboard::W)) && (selectedIndex_ > 0))
    {
        selectedIndex_--;
    }
}
