FROM harbor.k1dav.fun/proxy/py311node22:latest

# Install tslint, typescript. eslint is installed by javascript image
ARG NODE_MODULES="tslint-to-eslint-config typescript"
RUN sudo npm install -g ${NODE_MODULES} \
    && sudo npm cache clean --force > /dev/null 2>&1
