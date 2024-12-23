# ACGCourseProject

## Demo Creation Process:

**Install all necessary packages**, which will be shown in the error message of running **'npx vite'**.

Register an account and login. Now your account information will be stored in local indexedDB, and you don't have to login again unless manually logout.

Now you enter the level selection page.  You can choose the level you want to play by first **clicking the level on the Russian Roulette wheel**, and then **press "Enter"** to start the game.

For maze levels, **press arrow keys** to move the character. You will be blocked by the problems, and you can only pass by solving them and clicking the right choice. For music levels, **press Space** to turn the line, in order to avoid the obstacles.

Once you successfully pass the level, you can see a few more levels unlocked, which are the children levels of the one you just passed. Also, the levels you have passed will be stored in the indexedDB, so you don't need to pass them again when you re-enter the game.

Temporarily, we have only implemented one maze level and one music level. So you only need to play these two levels: caculus(maze) and physics education(music). Other levels are just replicas of these two levels.
## Reference

1. We use **https://egalahad.github.io/BattleTanks/** as game logic of the puzzle game, but anything specific in the code is not copied from this project. Moreover, a lot more features are added to our project, such as the login system, indexedDB, and the music game.
2. We use **https://github.com/SSF-Team/Dancing-Line** as the code base of the music game. But this is actually not a complete implementation of dancing line and has lots of bugs in handling collision and dropping. We basically rely on the music and rendering time alignment logic of this project. More functionalities of dancing line to the codebase, like collecting diamonds, game over logic, animation of the decorations, camera movement, etc., are added by us, and correct the bugs in handling collision and dropping.
