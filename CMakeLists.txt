cmake_minimum_required(VERSION 3.0.0)
project(my_sfml_template VERSION 0.1.0)

include(FetchContent)

set(BUILD_SHARED_LIBS OFF)
# set(SFML_BUILD_AUDIO OFF)

# to use Clang under Windows
# might want to tweak this on other platforms
if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    if(WIN32)
        set(FREETYPE_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(OPENAL_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(OGG_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(FLAC_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(VORBIS_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(VORBISENC_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
        set(VORBISFILE_LIBRARY ${CMAKE_BINARY_DIR}/_deps/sfml-src/extlibs/libs-msvc/x64/)
    endif()    
endif()

FetchContent_Declare(
	SFML
	GIT_REPOSITORY https://github.com/SFML/SFML.git
	GIT_TAG 2.5.1
)

FetchContent_MakeAvailable(SFML)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin/)

if(MSVC)
    add_compile_options("/std:c++17" "/W4" "$<$<CONFIG:RELEASE>:/O2>")
else()
    add_compile_options("-std=c++17" "-Wall" "-Wextra" "-Wshadow" "-pedantic" "$<$<CONFIG:RELEASE>:-O3>")
    if("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang")
        add_compile_options("-stdlib=libc++")
    else()
        # nothing special for gcc at the moment
    endif()
endif()

set(SOURCES
    src/main.cpp

    include/menu.hpp
    src/menu.cpp

    include/game.hpp
    src/game.cpp
)

set(CMAKE_CXX_CPPCHECK "cppcheck")
add_executable(game ${SOURCES})

target_include_directories(game PRIVATE include)

target_link_libraries(
	game
	sfml-graphics
    sfml-system
    sfml-window
    
)

if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    if(WIN32)
    target_link_libraries(
        game
        ${FREETYPE_LIBRARY}/freetype.lib)
    endif()    
endif()

add_custom_command(TARGET game POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy_directory
                       ${CMAKE_SOURCE_DIR}/assets/ $<TARGET_FILE_DIR:game>/assets/)


