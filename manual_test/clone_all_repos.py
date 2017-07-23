#!/usr/bin/env python
"""Clone lots of large CoffeeScript projects from GitHub.

Note that the CoffeeScript compiler is intentionally excluded because the test
suite isn't representative of real-world code.
"""
import urllib2
import json
import os
import sys


def clone_repo(url):
    print 'Cloning {}'.format(url)
    exit_code = os.system('git clone --depth 10 {}'.format(url))
    if exit_code:
        raise Exception('Command failed')


def clone_org(org):
    os.mkdir(org)
    os.chdir(org)
    for i in xrange(1, 100):
        results = json.load(urllib2.urlopen('https://api.github.com/orgs/{}/repos?page={}'.format(org, i)))
        for result in results:
            if not result['fork'] and result['language'] == 'CoffeeScript':
                clone_repo(result['clone_url'])
        if len(results) == 0:
            break
    os.chdir('..')


def main():
    clone_org('atom')
    clone_org('sharelatex')
    clone_repo('https://github.com/codecombat/codecombat.git')
    clone_repo('https://github.com/FelisCatus/SwitchyOmega.git')
    clone_repo('https://github.com/basecamp/trix.git')
    clone_repo('https://github.com/philc/vimium.git')
    clone_repo('https://github.com/yakyak/yakyak.git')
    clone_repo('https://github.com/baconjs/bacon.js.git')


if __name__ == '__main__':
    main()
