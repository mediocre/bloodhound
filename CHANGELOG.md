# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.13.0] - 2024-05-08
### Changed
- Updated DHL to use "description" and "remark" fields (see https://developer.dhl.com/api-reference/shipment-tracking?language_content_entity=en#release-notes-section/ecommerce-status-code).

## [1.12.0] - 2024-05-08
### Changed
- Updated FedEx to return the most recent tracking number data when FedEx creates a duplicate tracking number.

## [1.11.0] - 2021-06-13
### Changed
- Updated DHL to use DHL eCommerce Solutions first if configured.

## [1.10.0] - 2021-06-13
### Changed
- Updated DHL to use DHL eCommerce Solutions if configured.

## [1.9.0] - 2021-06-08
### Changed
- Updated the DHL API to use https://developer.dhl.com/api-reference/shipment-tracking.

## [1.8.1] - 2021-07-31
### Changed
- Updated the pitney-bowes module to ~0.3.0.

## [1.8.0] - 2021-07-27
### Changed
- Changed the tracking page URL for Pitney Bowes.

## [1.7.5] - 2021-03-17
### Changed
- Changed the default URL for USPS to use https (instead of http).
