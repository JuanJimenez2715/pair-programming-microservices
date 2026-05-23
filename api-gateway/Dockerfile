FROM kong:3.4-ubuntu

# Set up Kong to run in DB-less mode
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml

COPY kong.yml /usr/local/kong/declarative/kong.yml

USER root
RUN chown -R kong:0 /usr/local/kong/declarative && chmod -R g=u /usr/local/kong/declarative
USER kong
