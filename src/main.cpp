#include "game.hpp"

auto main() -> int
{
    Game game;
    game.initialize();
    game.run();
    return EXIT_SUCCESS;
}