##Django Tips
###[Remove .pyc files from git tracking](http://goo.gl/bcx3O)

First, git rm them
	find . -name "*.pyc" -exec git rm -f {} \;

Then, add a .gitignore file in the root of your repo and enter a line:
	*.pyc