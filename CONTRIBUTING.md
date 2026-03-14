# Contributing to show-me-your-think

First off, thank you for considering contributing to `show-me-your-think`! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. (Link to your CoC or use a standard one).

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker.
- Describe the bug and include steps to reproduce.

### Suggesting Enhancements

- Use the GitHub issue tracker.
- Describe the feature and why it would be useful.

### Pull Requests

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name` or `fix/your-fix-name`.
3. Make your changes.
4. Run tests (if available): `pnpm test`.
5. Commit your changes: `git commit -m 'feat: add some feature'`.
6. Push to the branch: `git push origin feature/your-feature-name`.
7. Submit a pull request.

## Development Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/daniyuu/show-me-your-think.git
   cd show-me-your-think
   ```

2. **Install dependencies:**
   This project uses `pnpm` and is organized as a monorepo.
   ```bash
   pnpm install
   ```

3. **Build the project:**
   ```bash
   pnpm build
   ```

4. **Run in development mode:**
   - For CLI: `pnpm dev analyze owner/repo`
   - For Web: `pnpm --filter @smyt/web dev`

## Code Style

- Follow the existing code style.
- Use meaningful variable and function names.
- Keep functions small and focused.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
