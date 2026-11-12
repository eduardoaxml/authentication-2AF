
FROM php:8.4-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libsqlite3-dev \
    unzip \
    && docker-php-ext-install \
    pdo_pgsql \
    pdo_sqlite \
    intl \
    zip \
    bcmath \
    opcache \
    curl \
    dom \
    mbstring \
    xml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
