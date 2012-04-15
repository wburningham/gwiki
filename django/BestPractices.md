##Installing Django

Mangage multiple dajngo installations. Install virttual environmernts.
	sudo easy_install virtualenv

Create a new python executable in the current directory
	virtualenv DJANGO

Activate the virtual environemnt
	source DJANGO/bin/activate

Install django
	pip install django==1.3


##Configuration
###Absolute paths
Avoid using an absolute file path. That way you can transfer projects between computers and it will still work.

Add the following to the top of your settings file:
	import os 
	DIR = os.path.abspath(os.path.dirname(__file__))
	#Use DIR in your absolute paths
	os.path.join (DIR, '/path/to/templates/)

###Inital configs
make your manage.py executable
	sudo chmod u+x manage.py

###Urls.py
Don't include the project name in the url routes


[src](http://www.youtube.com/watch?v=EcY1HBK9hf4)


