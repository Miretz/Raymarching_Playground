# Raymarching Playground

Project to play around with shaders.

Based on: [My SFML Template](https://github.com/Miretz/my_sfml_template)

<img src="screenshot.png" alt="Shader example" width="848" height="480">

# My setup
I use [Visual Studio Code](https://code.visualstudio.com/) with the following extensions:
- [Clangd](https://clangd.llvm.org/installation) - C++ code completion & highlighting
- [Clang-Format](https://clang.llvm.org/docs/ClangFormatStyleOptions.html) - Code formatting
- [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools) - CMake project support for VSCode
- [cppcheck](http://cppcheck.net/) - tool for static code analysis
- [SonarLint](https://www.sonarlint.org/vscode) - check for code quality & security issues

After installing these extensions, simply clone this repository and open the folder in VSCode. CMake Tools should recognize the project.
Copy the ```compile_commands.json``` file from ```build/``` to the parent directory.

Now you can use the following commands:
- ```CMake: Build``` - to build the executable (do this first)
- ```CMake: Run Without Debugging``` - to run the executable (shortcut Shift+F5)
- ```CMake: Debug``` - to run the project with debugging (shortcut Ctrl+F5)

If all goes well, you should see the "game" in action.

\
Tested on:
- Windows 10 with MinGW, Clang and Visual Studio 2022
- MacOS with GCC & Clang
